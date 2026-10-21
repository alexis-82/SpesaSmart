import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, Switch, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons as Icon } from '@expo/vector-icons';
import UpdateChecker from './UpdateChecker';
import OtaUpdater from './OtaUpdater';
import { NavigationBar } from 'expo-navigation-bar';
import Sidebar from './components/Sidebar';
import * as Application from 'expo-application';
import * as DocumentPicker from 'expo-document-picker';
import * as Sharing from 'expo-sharing';
import { File, Paths } from 'expo-file-system';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { buildBackup, parseBackup, backupFileName } from './backup';
import { filterProducts, productExists } from './search';

const KEEP_AWAKE_KEY = 'keepAwakeEnabled';
const KEEP_AWAKE_TAG = 'SpesaSmart';

// Attiva o disattiva il "mantieni schermo acceso" per tutta l'app
const applyKeepAwake = async (enabled: boolean): Promise<void> => {
  try {
    if (enabled) {
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
    } else {
      await deactivateKeepAwake(KEEP_AWAKE_TAG);
    }
  } catch (error) {
    console.error('Errore nella gestione dello standby:', error);
  }
};

const loadKeepAwake = async (): Promise<boolean> => {
  const saved = await AsyncStorage.getItem(KEEP_AWAKE_KEY);
  return saved === 'true';
};

// Event emitter per la gestione degli eventi globali
const EventEmitter = {
  listeners: new Map(),
  
  addListener(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(callback);
      }
    };
  },
  
  emit(event: string, data?: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback: (arg0: any) => any) => callback(data));
    }
  }
};

// Definizione dei tipi per la navigazione
type RootDrawerParamList = {
  ShoppingList: undefined;
  Products: undefined;
  Settings: undefined;
  Info: undefined;
};

const Drawer = createDrawerNavigator<RootDrawerParamList>();

// Tipi per la navigazione di ShoppingListScreen
type ShoppingListScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'ShoppingList'>;

// Tipi per la navigazione di ProductsScreen
type ProductsScreenNavigationProp = DrawerNavigationProp<RootDrawerParamList, 'Products'>;

type ShoppingListScreenProps = {
  navigation: ShoppingListScreenNavigationProp;
};

type ProductsScreenProps = {
  navigation: ProductsScreenNavigationProp;
};

// Schermata Lista della Spesa
const ShoppingListScreen: React.FC<ShoppingListScreenProps> = ({ navigation }) => {
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  useEffect(() => {
    loadShoppingList();
    
    // Ascolta l'evento di nuovo prodotto
    const unsubscribe = EventEmitter.addListener('newProduct', async (newItem: string) => {
      if (newItem) {
        await addItemToList(newItem);
        // Forziamo un ricaricamento immediato della lista
        await loadShoppingList();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadShoppingList();
    });
  
    return unsubscribe;
  }, [navigation]);

  const loadShoppingList = async () => {
    try {
      const savedList = await AsyncStorage.getItem('shoppingList');
      if (savedList) {
        const parsedList = JSON.parse(savedList);
        console.log('Lista della spesa caricata:', parsedList);
        setShoppingList(parsedList);
      }
    } catch (error) {
      console.error('Errore nel caricamento della lista della spesa:', error);
    }
  };

  const saveShoppingList = async (newList: string[]) => {
    try {
      await AsyncStorage.setItem('shoppingList', JSON.stringify(newList));
      console.log('Lista della spesa salvata:', newList);
    } catch (error) {
      console.error('Errore nel salvataggio della lista della spesa:', error);
    }
  };

  const addItemToList = async (newItem: string) => {
    try {
      // Prima carichiamo la lista corrente da AsyncStorage
      const savedList = await AsyncStorage.getItem('shoppingList');
      let currentList = savedList ? JSON.parse(savedList) : [];
      
      // Verifichiamo se l'elemento non è già presente
      if (!currentList.includes(newItem)) {
        // Aggiungiamo il nuovo elemento
        currentList.push(newItem);
        // Aggiorniamo lo stato
        setShoppingList(currentList);
        // Salviamo la lista aggiornata
        await AsyncStorage.setItem('shoppingList', JSON.stringify(currentList));
        console.log('Lista della spesa aggiornata:', currentList);
        // Forziamo il ricaricamento della lista
        await loadShoppingList();
      }
    } catch (error) {
      console.error('Errore nell\'aggiunta dell\'elemento:', error);
    }
  };

  const removeItem = (index: number): void => {
    const newList = shoppingList.filter((_, i) => i !== index);
    setShoppingList(newList);
    saveShoppingList(newList);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>La mia Lista della Spesa</Text>
      {shoppingList.length === 0 ? (
        <Text style={styles.emptyText}>Nessun prodotto nella lista</Text>
      ) : (
        <FlatList
          data={shoppingList}
          renderItem={({ item, index }) => (
            <View style={styles.listItem}>
              <Text style={styles.itemText}>{item}</Text>
              <TouchableOpacity 
                onPress={() => removeItem(index)}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>X</Text>
              </TouchableOpacity>
            </View>
          )}
          keyExtractor={(_, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      )}
    </View>
  );
};

// Schermata Prodotti
const ProductsScreen: React.FC<ProductsScreenProps> = ({ navigation }) => {
  const [products, setProducts] = useState<string[]>([]);
  const [newProduct, setNewProduct] = useState<string>('');
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  useEffect(() => {
    loadProducts();
    loadShoppingList();

    // Dopo l'import di un backup ricarica prodotti e lista
    const unsubscribe = EventEmitter.addListener('backupImported', () => {
      loadProducts();
      loadShoppingList();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadShoppingList();
    });

    return unsubscribe;
  }, [navigation]);

  const loadShoppingList = async () => {
    try {
      const savedList = await AsyncStorage.getItem('shoppingList');
      if (savedList) {
        setShoppingList(JSON.parse(savedList));
      }
    } catch (error) {
      console.error('Errore nel caricamento della lista della spesa:', error);
    }
  };

  const saveProducts = async (newProducts: string[]): Promise<void> => {
    try {
      await AsyncStorage.setItem('products', JSON.stringify(newProducts));
    } catch (error) {
      console.error('Errore nel salvataggio dei prodotti:', error);
    }
  };

  const loadProducts = async (): Promise<void> => {
    try {
      const savedProducts = await AsyncStorage.getItem('products');
      if (savedProducts) {
        setProducts(JSON.parse(savedProducts));
      }
    } catch (error) {
      console.error('Errore nel caricamento dei prodotti:', error);
    }
  };

  // Il campo serve sia a cercare sia ad aggiungere: filtra mentre si scrive
  const filteredProducts = filterProducts(products, newProduct);
  const isSearching = newProduct.trim().length > 0;
  const canAdd = isSearching && !productExists(products, newProduct);

  const addProduct = async (): Promise<void> => {
    if (canAdd) {
      const updatedProducts = [...products, newProduct.trim()].sort();
      setProducts(updatedProducts);
      await saveProducts(updatedProducts);
      
      // Aggiorna lo stato locale e emetti l'evento
      setShoppingList([...shoppingList, newProduct.trim()]);
      EventEmitter.emit('newProduct', newProduct.trim());
      setNewProduct('');
    }
  };

  const removeProduct = (index: number): void => {
    const updatedProducts = products.filter((_, i) => i !== index);
    setProducts(updatedProducts);
    saveProducts(updatedProducts);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Prodotti Disponibili</Text>
      <View style={styles.inputContainer}>
        <View style={styles.searchBox}>
          <Icon name="search" size={20} color="#888" />
          <TextInput
            style={styles.searchInput}
            value={newProduct}
            onChangeText={setNewProduct}
            onSubmitEditing={addProduct}
            placeholder="Cerca o aggiungi un prodotto"
            returnKeyType="done"
          />
          {isSearching && (
            <TouchableOpacity onPress={() => setNewProduct('')} hitSlop={10}>
              <Icon name="close-circle" size={20} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addButton, !canAdd && styles.addButtonDisabled]}
          onPress={addProduct}
          disabled={!canAdd}
        >
          <Text style={styles.buttonText}>Aggiungi</Text>
        </TouchableOpacity>
      </View>
      {isSearching && (
        <Text style={styles.searchResult}>
          {filteredProducts.length === 0
            ? 'Nessun prodotto trovato: premi Aggiungi per crearlo'
            : filteredProducts.length === 1
              ? '1 prodotto trovato'
              : `${filteredProducts.length} prodotti trovati`}
        </Text>
      )}
      <FlatList
        data={filteredProducts}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item: { item, index } }) => {
          const isInList = shoppingList.includes(item);
          return (
            <TouchableOpacity 
              style={[styles.listItem, isInList && styles.disabledItem]}
              onPress={() => {
                if (!isInList) {
                  // Aggiorna lo stato locale e emetti l'evento
                  setShoppingList([...shoppingList, item]);
                  EventEmitter.emit('newProduct', item);
                }
              }}
              disabled={isInList}
            >
              <Text style={[styles.itemText, isInList && styles.disabledText]}>
                {item} {isInList ? '(Già in lista)' : ''}
              </Text>
              <TouchableOpacity 
                onPress={(e) => {
                  e.stopPropagation();
                  removeProduct(index);
                }}
                style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>X</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        keyExtractor={({ index }) => index.toString()}
      />
    </View>
  );
};

// App principale
const App: React.FC = () => {
  useEffect(() => {
    loadKeepAwake()
      .then(applyKeepAwake)
      .catch(error => console.error('Errore nel caricamento dello standby:', error));
  }, []);

  return (
    <NavigationContainer>
      <UpdateChecker />
      <OtaUpdater />
      {/* Icone scure della barra di sistema: all'avvio React Native le imposta in base al tema
          scuro del telefono, ignorando che l'app è sempre chiara (succede nelle build di release) */}
      <NavigationBar style="dark" />
      <Drawer.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: '#fff',
          },
          headerTintColor: '#000',
          drawerStyle: {
            backgroundColor: '#fff',
            width: 240,
          },
          drawerType: 'front',
        }}
      >
        <Drawer.Screen
          name="ShoppingList"
          component={ShoppingListScreen}
          options={{
            headerTitle: 'Lista della Spesa',
            drawerLabel: 'Lista della Spesa',
            drawerIcon: ({ color, size }) => (
              <Icon name="list" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Products"
          component={ProductsScreen}
          options={{
            headerTitle: 'Prodotti',
            drawerLabel: 'Prodotti',
            drawerIcon: ({ color, size }) => (
              <Icon name="basket" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            headerTitle: 'Impostazioni',
            drawerLabel: 'Impostazioni',
            drawerIcon: ({ color, size }) => (
              <Icon name="settings" size={size} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="Info"
          component={InfoScreen}
          options={{
            headerTitle: 'Info',
            drawerLabel: 'Informazioni',
            drawerIcon: ({ color, size }) => (
              <Icon name="information-circle" size={size} color={color} />
            ),
          }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};

// Schermata Impostazioni: backup e standby
const SettingsScreen: React.FC = () => {
  const [keepAwakeEnabled, setKeepAwakeEnabled] = useState<boolean>(false);

  useEffect(() => {
    loadKeepAwake()
      .then(setKeepAwakeEnabled)
      .catch(error => console.error('Errore nel caricamento dello standby:', error));
  }, []);

  const toggleKeepAwake = async (value: boolean): Promise<void> => {
    setKeepAwakeEnabled(value);
    await applyKeepAwake(value);
    try {
      await AsyncStorage.setItem(KEEP_AWAKE_KEY, JSON.stringify(value));
    } catch (error) {
      console.error('Errore nel salvataggio dello standby:', error);
    }
  };

  const exportBackup = async (): Promise<void> => {
    try {
      const [savedProducts, savedList] = await Promise.all([
        AsyncStorage.getItem('products'),
        AsyncStorage.getItem('shoppingList'),
      ]);
      const now = new Date();
      const backup = buildBackup(
        Application.nativeApplicationVersion ?? '',
        savedProducts ? JSON.parse(savedProducts) : [],
        savedList ? JSON.parse(savedList) : [],
        keepAwakeEnabled,
        now,
      );

      const file = new File(Paths.cache, backupFileName(now));
      if (file.exists) {
        file.delete();
      }
      file.create();
      await file.write(JSON.stringify(backup, null, 2));

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert('Esporta backup', 'La condivisione non è disponibile su questo dispositivo.');
        return;
      }
      await Sharing.shareAsync(file.uri, {
        mimeType: 'application/json',
        dialogTitle: 'Esporta backup',
      });
    } catch (error) {
      console.error('Errore nell\'esportazione del backup:', error);
      Alert.alert('Esporta backup', 'Non è stato possibile esportare il backup.');
    }
  };

  const restoreBackup = async (text: string): Promise<void> => {
    try {
      const backup = parseBackup(text);
      await AsyncStorage.multiSet([
        ['products', JSON.stringify(backup.products)],
        ['shoppingList', JSON.stringify(backup.shoppingList)],
        [KEEP_AWAKE_KEY, JSON.stringify(backup.settings.keepAwakeEnabled)],
      ]);
      setKeepAwakeEnabled(backup.settings.keepAwakeEnabled);
      await applyKeepAwake(backup.settings.keepAwakeEnabled);
      EventEmitter.emit('backupImported');
      Alert.alert(
        'Importa backup',
        `Backup importato: ${backup.products.length} prodotti e ${backup.shoppingList.length} elementi nella lista.`,
      );
    } catch (error) {
      console.error('Errore nell\'importazione del backup:', error);
      Alert.alert('Importa backup', 'Non è stato possibile importare il backup.');
    }
  };

  const importBackup = async (): Promise<void> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled) {
        return;
      }

      const text = await new File(result.assets[0].uri).text();
      const backup = parseBackup(text);
      const date = backup.settings.exportDate || backup.timestamp;

      Alert.alert(
        'Importa backup',
        `Il backup${date ? ` del ${date}` : ''} contiene ${backup.products.length} prodotti e ` +
          `${backup.shoppingList.length} elementi nella lista.\n\n` +
          'I dati attuali verranno sostituiti. Continuare?',
        [
          { text: 'Annulla', style: 'cancel' },
          { text: 'Importa', style: 'destructive', onPress: () => restoreBackup(text) },
        ],
      );
    } catch (error) {
      console.error('Errore nella lettura del backup:', error);
      const message = error instanceof Error ? error.message : 'Il file non è leggibile.';
      Alert.alert('Importa backup', message);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }}>
      <Text style={styles.title}>Impostazioni</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📦 Backup & Ripristino</Text>
        <Text style={styles.settingDescription}>
          Salva e ripristina i tuoi dati tramite file JSON. Puoi condividere il backup via email,
          cloud o qualsiasi app di condivisione.
        </Text>
        <TouchableOpacity style={styles.settingCard} onPress={exportBackup}>
          <Icon name="download-outline" size={24} color="#007AFF" />
          <Text style={styles.settingLabel}>Esporta Backup</Text>
          <Icon name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.settingCard} onPress={importBackup}>
          <Icon name="cloud-upload-outline" size={24} color="#007AFF" />
          <Text style={styles.settingLabel}>Importa Backup</Text>
          <Icon name="chevron-forward" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>📱 Standby</Text>
        <View style={styles.settingCard}>
          <Icon name="phone-portrait-outline" size={24} color="#007AFF" />
          <Text style={styles.settingLabel}>Mantieni schermo acceso</Text>
          <Switch
            value={keepAwakeEnabled}
            onValueChange={toggleKeepAwake}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={keepAwakeEnabled ? '#007AFF' : '#f4f3f4'}
            ios_backgroundColor="#767577"
          />
        </View>
        <Text style={styles.settingHint}>
          Impedisce al dispositivo di andare in standby mentre l'app è in uso
        </Text>
      </View>
    </ScrollView>
  );
};

// Schermata Info completa
const InfoScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.infoContainer}>
        <Text style={styles.title}>SpesaSmart</Text>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Descrizione</Text>
          <Text style={styles.text}>
            SpesaSmart è la tua app per gestire la lista della spesa in modo semplice ed efficiente. 
            Puoi creare, modificare e organizzare la tua lista della spesa in pochi tap.
          </Text>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Funzionalità</Text>
          <View style={styles.featureList}>
            <Text style={styles.bulletPoint}>• Gestione lista della spesa</Text>
            <Text style={styles.bulletPoint}>• Catalogo prodotti personalizzabile</Text>
            <Text style={styles.bulletPoint}>• Aggiunta rapida alla lista</Text>
            <Text style={styles.bulletPoint}>• Salvataggio automatico</Text>
            <Text style={styles.bulletPoint}>• Backup e ripristino dei dati</Text>
            <Text style={styles.bulletPoint}>• Mantieni schermo acceso</Text>
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contatti</Text>
          <Text style={styles.text}>Email: alessioabrugiati@gmail.com</Text>
          <Text style={styles.text}>Sito web: www.alexis82.it</Text>
        </View>

        {Application.nativeApplicationVersion && (
          <Text style={styles.version}>Versione {Application.nativeApplicationVersion}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    paddingHorizontal: 10,
    marginRight: 10,
    borderRadius: 5,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  searchResult: {
    fontSize: 14,
    color: '#666',
    marginTop: -10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 5,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#a0c4f0',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listItem: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 5,
    marginBottom: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemText: {
    fontSize: 16,
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginTop: 20,
  },
  exitButton: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 20,
  },
  sectionContainer: {
    width: '100%',
    marginBottom: 25,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    textAlign: 'justify',
  },
  featureList: {
    marginTop: 10,
  },
  bulletPoint: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 5,
    color: '#333',
  },
  version: {
    marginTop: 20,
    fontSize: 14,
    color: '#666',
  },
  disabledItem: {
    opacity: 0.5,
    backgroundColor: '#f0f0f0',
  },
  disabledText: {
    color: '#666',
  },
  settingDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'center',
    marginBottom: 15,
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    backgroundColor: '#f8f8f8',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    marginBottom: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 18,
    color: '#007AFF',
    marginLeft: 15,
  },
  settingHint: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#666',
    paddingHorizontal: 10,
  },
});

export default App;
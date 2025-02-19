import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator, DrawerNavigationProp } from '@react-navigation/drawer';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import UpdateChecker from './UpdateChecker';
import Sidebar from './components/Sidebar';

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

  const handleExit = () => {
    BackHandler.exitApp();
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
          contentContainerStyle={{ paddingBottom: 100 }}
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, { width: '100%' }]}
          onPress={handleExit}
        >
          <Text style={styles.buttonText}>Esci</Text>
        </TouchableOpacity>
      </View>
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

  const addProduct = async (): Promise<void> => {
    if (newProduct.trim()) {
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
        <TextInput
          style={styles.input}
          value={newProduct}
          onChangeText={setNewProduct}
          placeholder="Nuovo prodotto"
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={addProduct}
        >
          <Text style={styles.buttonText}>Aggiungi</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={products}
        renderItem={({ item, index }) => {
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
        keyExtractor={(_, index) => index.toString()}
      />
    </View>
  );
};

// App principale
const App: React.FC = () => {
  return (
    <NavigationContainer>
      <UpdateChecker />
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
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Contatti</Text>
          <Text style={styles.text}>Email: alessioabrugiati@gmail.com</Text>
          <Text style={styles.text}>Sito web: www.alexis82.it</Text>
        </View>

        <Text style={styles.version}>Versione 1.3.1</Text>
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
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginRight: 10,
    borderRadius: 5,
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
  buttonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
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
});

export default App;
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { View, Text, TouchableOpacity, TextInput, FlatList, StyleSheet, BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import UpdateChecker from './UpdateChecker';


// Definizione dei tipi per la navigazione
type RootStackParamList = {
  ShoppingList: { newItem?: string } | undefined;
  Products: undefined;
  Info: undefined;
};

// Tipi per la navigazione di ShoppingListScreen
type ShoppingListScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ShoppingList'>;
type ShoppingListScreenRouteProp = RouteProp<RootStackParamList, 'ShoppingList'>;

// Tipi per la navigazione di ProductsScreen
type ProductsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Products'>;

type ShoppingListScreenProps = {
  navigation: ShoppingListScreenNavigationProp;
  route: ShoppingListScreenRouteProp;
};

type ProductsScreenProps = {
  navigation: ProductsScreenNavigationProp;
};

const Stack = createStackNavigator<RootStackParamList>();

// Schermata Lista della Spesa
const ShoppingListScreen: React.FC<ShoppingListScreenProps> = ({ navigation, route }) => {
  const [shoppingList, setShoppingList] = useState<string[]>([]);

  useEffect(() => {
    loadShoppingList();
  }, []);

  useEffect(() => {
    if (route.params?.newItem) {
      const newItem = route.params.newItem;
      addItemToList(newItem);
      navigation.setParams({ newItem: undefined });
    }
  }, [route.params?.newItem]);

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
        />
      )}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.buttonText}>Vai ai Prodotti</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.exitButton}
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

  useEffect(() => {
    loadProducts();
  }, []);

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
      setNewProduct('');

      // Navighiamo alla schermata della lista della spesa dopo aver aggiunto il prodotto
      navigation.navigate('ShoppingList', { newItem: newProduct.trim() });
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
        renderItem={({ item, index }) => (
          <TouchableOpacity 
            style={styles.listItem}
            onPress={() => {
              navigation.navigate('ShoppingList', { newItem: item });
            }}
          >
            <Text style={styles.itemText}>{item}</Text>
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
        )}
        keyExtractor={(_, index) => index.toString()}
      />
    </View>
  );
};

// App principale
const App: React.FC = () => {
  return (
    <>
      <UpdateChecker />
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName="ShoppingList"
          screenOptions={({ navigation }) => ({
            headerTitleAlign: 'center',
            headerStyle: {
              backgroundColor: '#fff',
            },
            headerTitleStyle: {
              fontWeight: 'bold',
              fontSize: 20,
            },
            headerRight: () => (
              <TouchableOpacity 
                onPress={() => navigation.navigate('Info')}
                style={{ marginRight: 15 }}
              >
                <Icon name="information-circle-outline" size={24} color="#007AFF" />
              </TouchableOpacity>
            ),
          })}
        >
          <Stack.Screen 
            name="ShoppingList" 
            component={ShoppingListScreen} 
            options={{ title: 'SpesaSmart' }}
          />
          <Stack.Screen 
            name="Products" 
            component={ProductsScreen} 
            options={{ title: 'SpesaSmart' }}
          />
          <Stack.Screen 
            name="Info" 
            component={InfoScreen} 
            options={{ title: 'Informazioni' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
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

        <Text style={styles.version}>Versione 1.2.0</Text>
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
});

export default App;
  import React, { useState, useEffect, useRef  } from 'react';
  import { View, Text, TextInput, Button, StyleSheet, TouchableOpacity, Image, Modal,ImageBackground, Animated } from 'react-native';
  import { ScrollView } from 'react-native-gesture-handler';
  import { getAuth, onAuthStateChanged, signOut } from '@firebase/auth';
  import { getDatabase, ref, onValue } from '@firebase/database';
  import { getDownloadURL, ref as storageRef, getStorage } from "firebase/storage";
  import { LinearGradient } from 'expo-linear-gradient';

  const RecordsScreen = ({ navigation }) => {
    const [money, setMoney] = useState('');
    const [source, setSource] = useState('');
    const [date, setDate] = useState(new Date()); // Initialize with current date
    const [category, setCategory] = useState('Income');
    const [records, setRecords] = useState([]);
    const [recordId, setRecordId] = useState(0); // Unique identifier for records
    const [totalMoney, setTotalMoney] = useState(0);
    const [totalSpent, setTotalSpent] = useState(0);
    const [totalSaved, setTotalSaved] = useState(0);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [profilePicture, setProfilePicture] = useState(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const slideAnim = useRef(new Animated.Value(-300)).current;
    const [firstName, setFirstName] = useState(null);
    const [lastName, setLastName] = useState(null);
    const [user, setUser] = useState(null);


    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
              const { firstName, lastName } = userData;
              setFirstName(firstName || '');
              setLastName(lastName || '');
              // Assuming fetchUserProfile fetches the profile picture based on user ID
              fetchUserProfile(user.uid, setProfilePicture);
            }
          });
        } else {
          // Clear profile picture URL when user is logged out
          setProfilePicture(null);
        }
      });
    
      return () => unsubscribe();
    }, [database]);
    // Function to format date as complete words (e.g., "January 1, 2023")
    const formatDate = (dateString) => {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    };

    const handleMoneyChange = (text) => {
      if (!text.trim()) {
        setMoney('0');
      } else {
        setMoney(text);
      }
    };

    const handleSourceChange = (text) => {
      setSource(text);
    };

    const handleSubmit = () => {
      let moneyValue = parseFloat(money);
      if (isNaN(moneyValue) || money.trim() === '') {
        moneyValue = 0.00;
      }

      const newRecord = {
        id: recordId, // Assign a unique ID to each record
        money: moneyValue, // Convert money to float
        source: source,
        date: date.toDateString(),
        category: category,
      };

      setRecords([...records, newRecord]);
      setRecordId(recordId + 1); // Increment record ID

      if (category === 'Income') {
        setTotalMoney(totalMoney + moneyValue);
        setTotalSaved(totalSaved + moneyValue);
      } else {
        setTotalMoney(totalMoney - moneyValue);
        setTotalSpent(totalSpent + moneyValue);
      }

      const currentDate = new Date();
      setDate(currentDate);

      setMoney('');
      setSource('');
    };

    const handleDelete = (id, money, category) => {
      const updatedRecords = records.filter(record => record.id !== id);
      setRecords(updatedRecords);

      if (category === 'Income') {
        setTotalMoney(totalMoney - money);
        setTotalSaved(totalSaved - money);
      } else {
        setTotalMoney(totalMoney + money);
        setTotalSpent(totalSpent - money);
      }
    };

    useEffect(() => {
      // Calculate initial total money based on records
      const initialTotal = records.reduce((acc, record) => {
        if (record.category === 'Income') {
          return acc + record.money;
        } else {
          return acc - record.money;
        }
      }, 0);
      setTotalMoney(initialTotal);

      // Initially display all records
      setFilteredRecords(records);
    }, [records]);

    const filterRecords = (filterType) => {
      if (filterType === 'All') {
        // If filter type is 'All', set filteredRecords to display all transactions
        setFilteredRecords(records);
      } else {
        // If filter type is 'Income' or 'Spent', filter records based on category
        const filtered = records.filter(record => record.category === filterType);
        setFilteredRecords(filtered);
      }
    };

    const database = getDatabase();

    useEffect(() => {
      const auth = getAuth();
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setUser(user);
        if (user) {
          const userRef = ref(database, `users/${user.uid}`);
          onValue(userRef, (snapshot) => {
            const userData = snapshot.val();
            if (userData) {
              const { firstName, lastName } = userData;
              setFirstName(firstName);
              setLastName(lastName);
            }
          });
          // Fetch profile picture URL when user is logged in
          fetchUserProfile(user.uid, setProfilePicture);
        } else {
          // Clear profile picture URL when user is logged out
          setProfilePicture(null);
        }
      });
      return () => unsubscribe();
    }, [database]);

    const handleAuthentication = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) {
          throw new Error('User not logged in.');
        }

        console.log('User logged out successfully!');
        await signOut(auth);
        setUser(null);
      } catch (error) {
        console.error('Logout error:', error);
      }
    };

    const toggleSidebar = () => {
      if (isSidebarOpen) {
        Animated.timing(slideAnim, {
          toValue: -300,
          duration: 300,
          useNativeDriver: false,
        }).start(() => setIsSidebarOpen(false));
      } else {
        setIsSidebarOpen(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }).start();
      }
    };

    const fetchUserProfile = async (uid, setProfilePicture) => {
      try {
        const storage = getStorage();
        const profilePictureRef = storageRef(storage, `profile-pictures/${uid}/profile-picture.jpg`);
        const url = await getDownloadURL(profilePictureRef);
        setProfilePicture(url);
      } catch (error) {
        console.error('Error fetching profile picture:', error);
        setProfilePicture(null); // Reset profile picture if fetch fails
      }
    };

    return (    
    <ImageBackground source={require('./assets/2ndBI.png')} style={styles.backgroundImage}>
        {/*-------------------------------- ----Header-------------------------------- */}
      <View style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={toggleSidebar} style={styles.sidebarButton}>
              <Text style={styles.sidebarButtonText}>≡</Text>
            </TouchableOpacity>
            <Image source={require('./assets/logo-modified.png')} style={styles.logo} />
            <TouchableOpacity onPress={() => navigation.navigate('Profile')}>
            {profilePicture ? (
              <Image source={{ uri: profilePicture }} style={styles.userIcon} />
            ) : (
              <Image source={require('./assets/user-icon.png')} style={styles.userIcon} />
            )}
            </TouchableOpacity>
          </View>
        <Text style={styles.title}>Total Amount Spent:</Text>
        <Text>${totalSpent.toFixed(2)}</Text>
        <Text style={styles.title}>Total Amount Saved:</Text> 
        <Text>${totalSaved.toFixed(2)}</Text>

        <TextInput
          style={styles.input}
          placeholder="Enter Amount"
          placeholderTextColor="white" 
          keyboardType="numeric"
          value={money}
          onChangeText={handleMoneyChange}
        />

        <TextInput
          style={styles.input}
          placeholder="Enter Source"
          placeholderTextColor="white" 
          value={source}
          onChangeText={handleSourceChange}
        />
        <Text style={styles.title}>Date: {formatDate(date)}</Text>
        <View style={styles.categoryContainer}>
          <Text style={styles.title}>Transaction Type:</Text>
          <Button
            title={category === 'Income' ? 'Income' : 'Spent'}
            onPress={() => setCategory(category === 'Income' ? 'Spent' : 'Income')}
          />
        </View>

        <Button title="Submit" onPress={handleSubmit} />


        <Text style={styles.title}>Transaction Details:</Text>
        <View style={styles.categoryContainer}>
          <Button
            title="All"
            onPress={() => filterRecords('All')}
          />
          <Button
            title="Income"
            onPress={() => filterRecords('Income')}
          />
          <Button
            title="Spent"
            onPress={() => filterRecords('Spent')}
          />
        </View>

        <ScrollView  style={styles.recordsContainer}>
          {filteredRecords.slice(0).reverse().map(record => (
            <View key={record.id} style={styles.recordItem}>
              <Text style={styles.Transaction}>{record.category} Transaction</Text>
              <Text style={styles.Amount}>Amount:${record.money.toFixed(2)}</Text>
              <Text style={styles.Source}>Source: {record.source}</Text>
              <Text style={styles.Date}>Date: {formatDate(record.date)}</Text>
              <TouchableOpacity onPress={() => handleDelete(record.id, record.money, record.category)}>
                <Text style={styles.deleteButton}>Delete</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
  {/* --------------------------------------------Sidebar-------------------------------------------- */}
  <Modal
            animationType="none"
            transparent={true}
            visible={isSidebarOpen}
            onRequestClose={toggleSidebar}
          >
            <LinearGradient
              colors={['rgba(16,42,96,0.97)', 'rgba(49,32,109,0.97)']}
              style={[styles.sidebar, { left: isSidebarOpen ? 0 : -300 }]}
            >
          <TouchableOpacity onPress={toggleSidebar} style={styles.closeButton}>
            <Image source={require('./assets/left_arrow.png')} />
          </TouchableOpacity>
              {profilePicture ? (
                <Image source={{ uri: profilePicture }} style={styles.sidebarIcon} />
              ) : (
                <Image source={require('./assets/user-icon.png')} style={styles.sidebarIcon} />
              )}
              <Text style={styles.sidebarName}>{firstName} {lastName}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Home')} style={styles.sidebarItem}>
              <View style={styles.buttonContainer}>
                      <Text style={styles.buttonText}>Home</Text>
                    </View>
            </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Records')} style={styles.sidebarItem}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Records</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('TaskCalendar')} style={styles.sidebarItem}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>TaskCalendar</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Onlinebanking')} style={styles.sidebarItem}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Online Banking</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Rewards')} style={styles.sidebarItem}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Rewards</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Goal Setting')} style={styles.sidebarItem}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Goal Setting</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Investment')} style={[styles.sidebarItem, { marginBottom: 20 }]}>
                <View style={styles.buttonContainer}>
                  <Text style={styles.buttonText}>Investment</Text>
                </View>
              </TouchableOpacity>
              {user ? (
                <TouchableOpacity onPress={handleAuthentication} style={[styles.buttonContainer, { position: 'absolute', bottom: 20 }]}>
                  <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>
              ) : null}
            </LinearGradient>
          </Modal>
      </View>
      </ImageBackground>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },

    sidebarButtonText: {
      fontSize: 35,
      color: 'white',
      top: 10,
    },
    input: {
      width: '80%',
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 5,
      padding: 10,
      marginBottom: 20,
      color: 'white',
    },
    categoryContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 20,
    },
    recordsContainer: {
      marginTop: 20,
    }
    ,
    recordItem: {
      marginBottom: 10,
    },
    deleteButton: {
      color: 'red',
    },
    sidebarItem: {
      marginBottom: 10, 
      color: 'white',
      textAlign: "center",
      width: '100%',
    },  header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },

    logo: {
      height: 50,
      width: 50,
      top: 10,
    },

    sidebarName: {
      marginBottom: 10,
      fontSize: 18, 
      color: 'white',
      textAlign: "center",
      width: '100%',
      top: -35,
    },
    
    title:{color: 'white'},
    sidebar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: '#fff',
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      marginTop: 20,
      padding: 10,
      backgroundColor: '#f0f0f0',
      borderRadius: 5,
      zIndex: 1,
    },
    sidebarItem: {
      marginBottom: 10, 
      color: 'white',
      textAlign: "center",
      width: '100%',
    },  backgroundImage: {
      flex: 1,
      resizeMode: 'cover',
      justifyContent: 'center',
    },
    buttonContainer: {
      width: '100%',
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'white',
      borderRadius: 10,
      marginBottom: 5,
      backgroundColor: 'transparent',
    },
    buttonText: {
      color: 'white',
      textAlign: 'center',
    },
    sidebarIcon: {
      width: 85,
      height: 85,
      borderRadius: 55,
      marginRight: 4,
      top: -45,
    },

    sidebarButton: {
      padding: 10,
    },

    userIcon: {
      width: 40,
      height: 40,
      borderRadius: 50,
      marginRight: 10,
      top: 10,
    },
    sidebar: {
      position: 'absolute',
      top: 0,
      bottom: 0,
      width: 300,
      backgroundColor: '#fff',
      padding: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    closeButton: {
      position: 'absolute',
      top: 22,
      left: 22,
      padding: 1,
      borderRadius: 5,
      zIndex: 1,
    },
  });



  export default RecordsScreen;

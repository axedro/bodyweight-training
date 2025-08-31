import React, { useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Text } from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';

interface LoadingScreenProps {
  navigation: any;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ navigation }) => {
  const { user, loading: authLoading } = useAuth();
  const { userProfile, loading: profileLoading } = useSupabase();

  useEffect(() => {
    if (!authLoading && !profileLoading) {
      if (!user) {
        navigation.replace('Auth');
      } else if (!userProfile || !userProfile.age) {
        navigation.replace('Onboarding');
      } else {
        navigation.replace('Main');
      }
    }
  }, [user, userProfile, authLoading, profileLoading]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Cargando Bodyweight Training...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
});

export default LoadingScreen;

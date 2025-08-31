import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { authService, profileService, UserProfile } from './src/services/supabase';

// Pantalla de Autenticación
const AuthScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }
    
    setLoading(true);
    
    try {
      const response = isSignUp 
        ? await authService.signUp(email, password)
        : await authService.signIn(email, password);

      if (response.success) {
        if (isSignUp) {
          Alert.alert('¡Éxito!', 'Cuenta creada. Revisa tu email para confirmar.');
          setIsSignUp(false);
        } else {
          // Verificar si el usuario tiene perfil
          const user = await authService.getCurrentUser();
          if (user) {
            const profile = await profileService.getProfile(user.id);
            if (profile && profile.age) {
              onNavigate('dashboard');
            } else {
              onNavigate('onboarding');
            }
          }
        }
      } else {
        Alert.alert('Error', response.error || 'Error inesperado');
      }
    } catch (error) {
      Alert.alert('Error', 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bodyweight Training</Text>
      <Text style={styles.subtitle}>Entrenamiento adaptativo de fuerza sin pesas</Text>
      
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#666"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          placeholderTextColor="#666"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Cargando...' : (isSignUp ? 'Crear Cuenta' : 'Iniciar Sesión')}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, styles.buttonOutline]}
          onPress={() => setIsSignUp(!isSignUp)}
          disabled={loading}
        >
          <Text style={styles.buttonOutlineText}>
            {isSignUp ? '¿Ya tienes cuenta? Iniciar Sesión' : '¿No tienes cuenta? Crear Cuenta'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// Pantalla de Onboarding
const OnboardingScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: '',
    weight: '',
    height: '',
    experience: 'beginner',
    availableDays: '3'
  });
  const [loading, setLoading] = useState(false);

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        Alert.alert('Error', 'Usuario no autenticado');
        onNavigate('auth');
        return;
      }

      const profileData = {
        email: user.email || '',
        age: parseInt(formData.age),
        weight: parseFloat(formData.weight),
        height: parseInt(formData.height),
        experience_level: formData.experience,
        available_days: parseInt(formData.availableDays),
      };

      const response = await profileService.createProfile(user.id, profileData);
      
      if (response.success) {
        Alert.alert('¡Perfecto!', 'Tu perfil ha sido configurado correctamente');
        onNavigate('dashboard');
      } else {
        Alert.alert('Error', response.error || 'Error al guardar perfil');
      }
    } catch (error) {
      Alert.alert('Error', 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 1 de 3</Text>
            <Text style={styles.stepSubtitle}>Información básica</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Edad"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData({...formData, age: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Peso (kg)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.weight}
              onChangeText={(text) => setFormData({...formData, weight: text})}
            />
            
            <TextInput
              style={styles.input}
              placeholder="Altura (cm)"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={formData.height}
              onChangeText={(text) => setFormData({...formData, height: text})}
            />
          </View>
        );
      
      case 2:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 2 de 3</Text>
            <Text style={styles.stepSubtitle}>Nivel de experiencia</Text>
            
            <Text style={styles.label}>¿Cuál es tu nivel de experiencia?</Text>
            
            {['beginner', 'intermediate', 'advanced'].map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.optionButton,
                  formData.experience === level && styles.optionButtonSelected
                ]}
                onPress={() => setFormData({...formData, experience: level})}
              >
                <Text style={[
                  styles.optionText,
                  formData.experience === level && styles.optionTextSelected
                ]}>
                  {level === 'beginner' ? 'Principiante' : 
                   level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
      
      case 3:
        return (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Paso 3 de 3</Text>
            <Text style={styles.stepSubtitle}>Disponibilidad</Text>
            
            <Text style={styles.label}>¿Cuántos días puedes entrenar por semana?</Text>
            
            {['2', '3', '4', '5'].map((days) => (
              <TouchableOpacity
                key={days}
                style={[
                  styles.optionButton,
                  formData.availableDays === days && styles.optionButtonSelected
                ]}
                onPress={() => setFormData({...formData, availableDays: days})}
              >
                <Text style={[
                  styles.optionText,
                  formData.availableDays === days && styles.optionTextSelected
                ]}>
                  {days} días
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        );
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Configura tu perfil</Text>
      <Text style={styles.subtitle}>Personaliza tu experiencia de entrenamiento</Text>
      
      {renderStep()}
      
      <View style={styles.navigation}>
        {step > 1 && (
          <TouchableOpacity 
            style={[styles.button, styles.buttonOutline]}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.buttonOutlineText}>Anterior</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Guardando...' : step === 3 ? 'Completar' : 'Siguiente'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

// Pantalla de Dashboard
const DashboardScreen = ({ onNavigate }: { onNavigate: (screen: string) => void }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const profile = await profileService.getProfile(user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      onNavigate('auth');
    } catch (error) {
      Alert.alert('Error', 'Error al cerrar sesión');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.subtitle}>Tu rutina personalizada está lista</Text>
      
      {userProfile && (
        <View style={styles.dashboardCard}>
          <Text style={styles.cardTitle}>Tu Perfil</Text>
          <Text style={styles.cardText}>Edad: {userProfile.age} años</Text>
          <Text style={styles.cardText}>Peso: {userProfile.weight} kg</Text>
          <Text style={styles.cardText}>Altura: {userProfile.height} cm</Text>
          <Text style={styles.cardText}>Nivel: {userProfile.experience_level}</Text>
          <Text style={styles.cardText}>Días disponibles: {userProfile.available_days}</Text>
        </View>
      )}
      
      <View style={styles.dashboardCard}>
        <Text style={styles.cardTitle}>Rutina de Hoy</Text>
        <Text style={styles.cardText}>Ejercicios adaptados a tu nivel</Text>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Comenzar Entrenamiento</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity 
        style={[styles.button, styles.buttonOutline]}
        onPress={handleSignOut}
      >
        <Text style={styles.buttonOutlineText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </View>
  );
};

// Componente principal con navegación
export default function App() {
  const [currentScreen, setCurrentScreen] = useState('auth');

  const renderScreen = () => {
    switch (currentScreen) {
      case 'auth':
        return <AuthScreen onNavigate={setCurrentScreen} />;
      case 'onboarding':
        return <OnboardingScreen onNavigate={setCurrentScreen} />;
      case 'dashboard':
        return <DashboardScreen onNavigate={setCurrentScreen} />;
      default:
        return <AuthScreen onNavigate={setCurrentScreen} />;
    }
  };

  return renderScreen();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    marginTop: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  form: {
    width: '100%',
    justifyContent: 'center',
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  optionButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    alignItems: 'center',
  },
  optionButtonSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  optionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  buttonOutlineText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonDisabledText: {
    color: '#999',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  dashboardCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
  },
});

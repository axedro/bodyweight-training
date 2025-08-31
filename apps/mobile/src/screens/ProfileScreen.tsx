import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  Button,
  List,
  Divider,
  Avatar,
} from 'react-native-paper';
import { useAuth } from '../contexts/AuthContext';
import { useSupabase } from '../contexts/SupabaseContext';

const ProfileScreen: React.FC = () => {
  const { user, signOut } = useAuth();
  const { userProfile } = useSupabase();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await signOut();
            } catch (error) {
              Alert.alert('Error', 'No se pudo cerrar sesión');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const getFitnessLevelText = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Principiante';
      case 'intermediate':
        return 'Intermedio';
      case 'advanced':
        return 'Avanzado';
      default:
        return 'No especificado';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Text 
          size={80} 
          label={userProfile?.email?.charAt(0).toUpperCase() || 'U'} 
          style={styles.avatar}
        />
        <Title style={styles.name}>{userProfile?.email}</Title>
        <Paragraph style={styles.subtitle}>
          Miembro desde {userProfile?.created_at ? 
            new Date(userProfile.created_at).toLocaleDateString('es-ES') : 
            'Recientemente'
          }
        </Paragraph>
      </View>

      {/* Profile Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Información del Perfil</Title>
          
          <List.Item
            title="Edad"
            description={userProfile?.age ? `${userProfile.age} años` : 'No especificada'}
            left={(props) => <List.Icon {...props} icon="account" />}
          />
          
          <Divider />
          
          <List.Item
            title="Peso"
            description={userProfile?.weight ? `${userProfile.weight} kg` : 'No especificado'}
            left={(props) => <List.Icon {...props} icon="scale" />}
          />
          
          <Divider />
          
          <List.Item
            title="Altura"
            description={userProfile?.height ? `${userProfile.height} cm` : 'No especificada'}
            left={(props) => <List.Icon {...props} icon="ruler" />}
          />
          
          <Divider />
          
          <List.Item
            title="Nivel de Fitness"
            description={getFitnessLevelText(userProfile?.fitness_level || '')}
            left={(props) => <List.Icon {...props} icon="dumbbell" />}
          />
          
          <Divider />
          
          <List.Item
            title="Experiencia"
            description={userProfile?.experience_years ? `${userProfile.experience_years} años` : '0 años'}
            left={(props) => <List.Icon {...props} icon="calendar" />}
          />
        </Card.Content>
      </Card>

      {/* Training Preferences */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Preferencias de Entrenamiento</Title>
          
          <List.Item
            title="Días por semana"
            description={`${userProfile?.available_days_per_week || 3} días`}
            left={(props) => <List.Icon {...props} icon="calendar-week" />}
          />
          
          <Divider />
          
          <List.Item
            title="Duración de sesión"
            description={`${userProfile?.preferred_session_duration || 30} minutos`}
            left={(props) => <List.Icon {...props} icon="clock" />}
          />
          
          <Divider />
          
          <List.Item
            title="Intensidad preferida"
            description={`${Math.round((userProfile?.preferred_intensity || 0.7) * 100)}%`}
            left={(props) => <List.Icon {...props} icon="target" />}
          />
        </Card.Content>
      </Card>

      {/* Current Stats */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Estadísticas Actuales</Title>
          
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{userProfile?.current_fitness_score?.toFixed(1) || 'N/A'}</Text>
              <Text style={styles.statLabel}>Nivel de Fitness</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round((userProfile?.adherence_rate || 0) * 100)}%
              </Text>
              <Text style={styles.statLabel}>Adherencia</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Account Actions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Cuenta</Title>
          
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Función en desarrollo', 'Esta función estará disponible próximamente')}
            style={styles.actionButton}
            icon="account-edit"
          >
            Editar Perfil
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Función en desarrollo', 'Esta función estará disponible próximamente')}
            style={styles.actionButton}
            icon="cog"
          >
            Configuración
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => Alert.alert('Función en desarrollo', 'Esta función estará disponible próximamente')}
            style={styles.actionButton}
            icon="help-circle"
          >
            Ayuda y Soporte
          </Button>
          
          <Button
            mode="outlined"
            onPress={handleSignOut}
            loading={loading}
            disabled={loading}
            style={[styles.actionButton, styles.signOutButton]}
            icon="logout"
            textColor="#F44336"
          >
            Cerrar Sesión
          </Button>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  avatar: {
    marginBottom: 15,
    backgroundColor: '#007AFF',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  card: {
    margin: 10,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  actionButton: {
    marginBottom: 10,
  },
  signOutButton: {
    borderColor: '#F44336',
  },
});

export default ProfileScreen;

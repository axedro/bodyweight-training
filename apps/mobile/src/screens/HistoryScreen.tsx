import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
  List,
  Chip,
} from 'react-native-paper';
import { useSupabase } from '../contexts/SupabaseContext';
import { TrainingSession } from '@bodyweight/shared';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const HistoryScreen: React.FC = () => {
  const { userProfile, supabase } = useSupabase();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrainingHistory();
  }, [userProfile?.id]);

  const loadTrainingHistory = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .order('session_date', { ascending: false })
        .limit(20);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading training history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'in_progress':
        return '#FF9800';
      case 'skipped':
        return '#F44336';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En progreso';
      case 'skipped':
        return 'Saltado';
      default:
        return 'Planificado';
    }
  };

  const renderSession = ({ item }: { item: TrainingSession }) => (
    <Card style={styles.sessionCard}>
      <Card.Content>
        <View style={styles.sessionHeader}>
          <View>
            <Title style={styles.sessionTitle}>
              Sesión de {item.actual_duration || item.planned_duration} min
            </Title>
            <Text style={styles.sessionDate}>
              {format(new Date(item.session_date), 'EEEE, d MMMM yyyy', { locale: es })}
            </Text>
          </View>
          <Chip
            mode="outlined"
            textStyle={{ color: getStatusColor(item.status) }}
            style={{ borderColor: getStatusColor(item.status) }}
          >
            {getStatusText(item.status)}
          </Chip>
        </View>

        <View style={styles.sessionStats}>
          {item.ica_score && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>ICA</Text>
              <Text style={styles.statValue}>{item.ica_score.toFixed(1)}</Text>
            </View>
          )}
          
          {item.actual_intensity && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Intensidad</Text>
              <Text style={styles.statValue}>
                {Math.round(item.actual_intensity * 100)}%
              </Text>
            </View>
          )}
          
          {item.actual_duration && (
            <View style={styles.stat}>
              <Text style={styles.statLabel}>Duración</Text>
              <Text style={styles.statValue}>{item.actual_duration} min</Text>
            </View>
          )}
        </View>

        {item.notes && (
          <Text style={styles.notes}>{item.notes}</Text>
        )}
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando historial...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Historial de Entrenamientos</Title>
        <Paragraph style={styles.subtitle}>
          Últimas {sessions.length} sesiones
        </Paragraph>
      </View>

      {sessions.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Card.Content style={styles.emptyContent}>
            <Text style={styles.emptyTitle}>No hay sesiones registradas</Text>
            <Text style={styles.emptySubtitle}>
              Comienza tu primera sesión de entrenamiento para ver tu historial aquí.
            </Text>
          </Card.Content>
        </Card>
      ) : (
        <FlatList
          data={sessions}
          renderItem={renderSession}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    padding: 10,
  },
  sessionCard: {
    marginBottom: 10,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  sessionTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  notes: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 10,
  },
  emptyCard: {
    margin: 20,
    elevation: 2,
  },
  emptyContent: {
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default HistoryScreen;

import React, { useState, useEffect } from 'react';
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
  ProgressBar,
  Chip,
  List,
} from 'react-native-paper';
import { useSupabase } from '../contexts/SupabaseContext';
import { TrainingPlan } from '@bodyweight/shared';

const CurrentSessionScreen: React.FC = () => {
  const { userProfile } = useSupabase();
  const [trainingPlan, setTrainingPlan] = useState<TrainingPlan | null>(null);
  const [sessionState, setSessionState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Aquí se cargaría el plan de entrenamiento real
    // Por ahora usamos datos mock
    const mockPlan: TrainingPlan = {
      current_session: {
        warm_up: [
          { id: '1', name: 'Arm Circles', description: 'Círculos con los brazos' },
          { id: '2', name: 'Jumping Jacks', description: 'Saltos con apertura de brazos' },
        ],
        main_work: [
          {
            exercise: { id: '3', name: 'Push-ups', description: 'Flexiones de pecho' },
            sets: 3,
            reps: 10,
            rest_time: 60,
          },
          {
            exercise: { id: '4', name: 'Squats', description: 'Sentadillas' },
            sets: 3,
            reps: 15,
            rest_time: 60,
          },
        ],
        cool_down: [
          { id: '5', name: 'Stretching', description: 'Estiramientos' },
        ],
        total_volume_load: 75,
        estimated_duration: 30,
        intensity_target: 0.7,
        recovery_requirement: 24,
      },
      next_sessions: [],
      ica_score: 5.0,
      recommendations: [
        'Mantén una buena hidratación',
        'Descansa lo suficiente entre series',
        'Enfócate en la forma técnica'
      ]
    };

    setTrainingPlan(mockPlan);
  }, []);

  const session = trainingPlan?.current_session;
  const totalExercises = session ? 
    session.warm_up.length + session.main_work.length + session.cool_down.length : 0;
  const completedCount = completedExercises.size;
  const progress = totalExercises > 0 ? (completedCount / totalExercises) * 100 : 0;

  const handleStartSession = () => {
    setSessionState('in_progress');
  };

  const handleCompleteExercise = (exerciseId: string) => {
    setCompletedExercises(prev => new Set([...prev, exerciseId]));
  };

  const handleCompleteSession = () => {
    setSessionState('completed');
    Alert.alert('¡Excelente!', 'Sesión completada con éxito');
  };

  if (!session) {
    return (
      <View style={styles.container}>
        <Text>Cargando sesión...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Sesión de Entrenamiento</Title>
        <Paragraph style={styles.subtitle}>
          {sessionState === 'not_started' && 'Preparado para comenzar'}
          {sessionState === 'in_progress' && '¡En progreso! Mantén el ritmo'}
          {sessionState === 'completed' && '¡Excelente trabajo! Sesión completada'}
        </Paragraph>
      </View>

      {/* Session Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{session.estimated_duration}</Text>
              <Text style={styles.statLabel}>Minutos</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{Math.round(session.intensity_target * 100)}%</Text>
              <Text style={styles.statLabel}>Intensidad</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{session.recovery_requirement}h</Text>
              <Text style={styles.statLabel}>Recuperación</Text>
            </View>
          </View>

          {sessionState !== 'not_started' && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Progreso: {completedCount}/{totalExercises} ejercicios
              </Text>
              <ProgressBar progress={progress / 100} style={styles.progressBar} />
            </View>
          )}

          {sessionState === 'not_started' && (
            <Button
              mode="contained"
              onPress={handleStartSession}
              style={styles.button}
            >
              Comenzar Sesión
            </Button>
          )}

          {sessionState === 'in_progress' && progress === 100 && (
            <Button
              mode="contained"
              onPress={handleCompleteSession}
              style={styles.button}
            >
              Completar Sesión
            </Button>
          )}
        </Card.Content>
      </Card>

      {/* Warm Up */}
      {session.warm_up.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Calentamiento</Title>
            {session.warm_up.map((exercise) => (
              <List.Item
                key={exercise.id}
                title={exercise.name}
                description={exercise.description}
                left={(props) => <List.Icon {...props} icon="fire" />}
                right={() => 
                  sessionState === 'in_progress' && (
                    <Button
                      mode={completedExercises.has(exercise.id) ? "outlined" : "contained"}
                      onPress={() => handleCompleteExercise(exercise.id)}
                      compact
                    >
                      {completedExercises.has(exercise.id) ? '✓' : 'Completar'}
                    </Button>
                  )
                }
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Main Work */}
      {session.main_work.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Trabajo Principal</Title>
            {session.main_work.map((block) => (
              <List.Item
                key={block.exercise.id}
                title={block.exercise.name}
                description={`${block.sets} series x ${block.reps} repeticiones`}
                left={(props) => <List.Icon {...props} icon="dumbbell" />}
                right={() => 
                  sessionState === 'in_progress' && (
                    <Button
                      mode={completedExercises.has(block.exercise.id) ? "outlined" : "contained"}
                      onPress={() => handleCompleteExercise(block.exercise.id)}
                      compact
                    >
                      {completedExercises.has(block.exercise.id) ? '✓' : 'Completar'}
                    </Button>
                  )
                }
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Cool Down */}
      {session.cool_down.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Enfriamiento</Title>
            {session.cool_down.map((exercise) => (
              <List.Item
                key={exercise.id}
                title={exercise.name}
                description={exercise.description}
                left={(props) => <List.Icon {...props} icon="snowflake" />}
                right={() => 
                  sessionState === 'in_progress' && (
                    <Button
                      mode={completedExercises.has(exercise.id) ? "outlined" : "contained"}
                      onPress={() => handleCompleteExercise(exercise.id)}
                      compact
                    >
                      {completedExercises.has(exercise.id) ? '✓' : 'Completar'}
                    </Button>
                  )
                }
              />
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Recommendations */}
      {trainingPlan?.recommendations && trainingPlan.recommendations.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Recomendaciones</Title>
            {trainingPlan.recommendations.map((recommendation, index) => (
              <View key={index} style={styles.recommendationItem}>
                <Text style={styles.recommendationText}>• {recommendation}</Text>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}
    </ScrollView>
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
  card: {
    margin: 10,
    elevation: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  stat: {
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
  },
  progressContainer: {
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
  },
  button: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 10,
  },
  recommendationItem: {
    marginBottom: 8,
  },
  recommendationText: {
    fontSize: 14,
    color: '#666',
  },
});

export default CurrentSessionScreen;

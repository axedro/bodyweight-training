import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Title,
  Paragraph,
} from 'react-native-paper';
import { useSupabase } from '../contexts/SupabaseContext';
import { TrainingSession } from '@bodyweight/shared';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';

const ProgressScreen: React.FC = () => {
  const { userProfile, supabase } = useSupabase();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionsForProgress();
  }, [userProfile?.id]);

  const loadSessionsForProgress = async () => {
    if (!userProfile?.id) return;

    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('user_id', userProfile.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: true })
        .limit(30);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading sessions for progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateWeeklyStats = () => {
    const now = new Date();
    const weekStart = startOfWeek(now, { locale: es });
    const weekEnd = endOfWeek(now, { locale: es });

    const weekSessions = sessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      return sessionDate >= weekStart && sessionDate <= weekEnd;
    });

    return {
      sessionsThisWeek: weekSessions.length,
      totalDuration: weekSessions.reduce((sum, session) => sum + (session.actual_duration || 0), 0),
      avgIntensity: weekSessions.length > 0 
        ? weekSessions.reduce((sum, session) => sum + (session.actual_intensity || 0), 0) / weekSessions.length
        : 0,
      avgICA: weekSessions.length > 0
        ? weekSessions.reduce((sum, session) => sum + (session.ica_score || 0), 0) / weekSessions.length
        : 0
    };
  };

  const calculateMonthlyProgress = () => {
    const last30Days = sessions.filter(session => {
      const sessionDate = new Date(session.session_date);
      const thirtyDaysAgo = subDays(new Date(), 30);
      return sessionDate >= thirtyDaysAgo;
    });

    return {
      sessionsLast30Days: last30Days.length,
      consistencyRate: last30Days.length / 30 * 100,
      improvementRate: calculateImprovementRate(last30Days)
    };
  };

  const calculateImprovementRate = (recentSessions: TrainingSession[]) => {
    if (recentSessions.length < 2) return 0;

    const sortedSessions = recentSessions.sort((a, b) => 
      new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
    );

    const firstHalf = sortedSessions.slice(0, Math.floor(sortedSessions.length / 2));
    const secondHalf = sortedSessions.slice(Math.floor(sortedSessions.length / 2));

    const avgFirstHalf = firstHalf.reduce((sum, session) => sum + (session.ica_score || 0), 0) / firstHalf.length;
    const avgSecondHalf = secondHalf.reduce((sum, session) => sum + (session.ica_score || 0), 0) / secondHalf.length;

    return avgFirstHalf > 0 ? ((avgSecondHalf - avgFirstHalf) / avgFirstHalf) * 100 : 0;
  };

  const weeklyStats = calculateWeeklyStats();
  const monthlyProgress = calculateMonthlyProgress();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Cargando progreso...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Title style={styles.title}>Progreso y Estadísticas</Title>
        <Paragraph style={styles.subtitle}>
          Tu evolución en el entrenamiento
        </Paragraph>
      </View>

      {/* Weekly Overview */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Resumen de la Semana</Title>
          <Paragraph style={styles.cardSubtitle}>Estadísticas de esta semana</Paragraph>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.sessionsThisWeek}</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{weeklyStats.totalDuration}</Text>
              <Text style={styles.statLabel}>Minutos totales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(weeklyStats.avgIntensity * 100)}%
              </Text>
              <Text style={styles.statLabel}>Intensidad promedio</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {weeklyStats.avgICA.toFixed(1)}
              </Text>
              <Text style={styles.statLabel}>ICA promedio</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Progress */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Progreso Mensual</Title>
          <Paragraph style={styles.cardSubtitle}>Últimos 30 días de entrenamiento</Paragraph>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{monthlyProgress.sessionsLast30Days}</Text>
              <Text style={styles.statLabel}>Sesiones completadas</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {Math.round(monthlyProgress.consistencyRate)}%
              </Text>
              <Text style={styles.statLabel}>Tasa de consistencia</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { color: monthlyProgress.improvementRate > 0 ? '#4CAF50' : '#F44336' }
              ]}>
                {monthlyProgress.improvementRate > 0 ? '+' : ''}{Math.round(monthlyProgress.improvementRate)}%
              </Text>
              <Text style={styles.statLabel}>Mejora en ICA</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Recent Performance */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.cardTitle}>Rendimiento Reciente</Title>
          <Paragraph style={styles.cardSubtitle}>Últimas 10 sesiones completadas</Paragraph>
          
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No hay datos de rendimiento</Text>
              <Text style={styles.emptySubtitle}>
                Completa algunas sesiones para ver tu rendimiento aquí.
              </Text>
            </View>
          ) : (
            <View style={styles.recentSessions}>
              {sessions.slice(-10).reverse().map((session) => (
                <View key={session.id} style={styles.sessionItem}>
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionDate}>
                      {format(new Date(session.session_date), 'dd MMM', { locale: es })}
                    </Text>
                    <Text style={styles.sessionIntensity}>
                      {Math.round((session.actual_intensity || 0) * 100)}% intensidad
                    </Text>
                  </View>
                  <Text style={styles.sessionICA}>
                    ICA: {session.ica_score?.toFixed(1) || 'N/A'}
                  </Text>
                </View>
              ))}
            </View>
          )}
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
  cardTitle: {
    fontSize: 18,
    marginBottom: 5,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 15,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recentSessions: {
    marginTop: 10,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionDate: {
    fontSize: 14,
    color: '#666',
  },
  sessionIntensity: {
    fontSize: 12,
    color: '#999',
  },
  sessionICA: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#007AFF',
  },
});

export default ProgressScreen;

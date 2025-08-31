import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  Title,
  Paragraph,
  ProgressBar,
  SegmentedButtons,
} from 'react-native-paper';
import { useSupabase } from '../contexts/SupabaseContext';
import { useAuth } from '../contexts/AuthContext';
import { OnboardingData, FitnessLevel } from '@bodyweight/shared';

const OnboardingScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<OnboardingData>>({
    age: undefined,
    weight: undefined,
    height: undefined,
    body_fat_percentage: undefined,
    fitness_level: 'beginner',
    experience_years: 0,
    available_days_per_week: 3,
    preferred_session_duration: 30,
    preferred_intensity: 0.7,
  });

  const { user } = useAuth();
  const { supabase } = useSupabase();

  const updateFormData = (field: keyof OnboardingData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!user) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          email: user.email,
          ...formData,
        });

      if (error) throw error;

      Alert.alert(
        '¡Perfil creado!',
        'Tu perfil ha sido configurado correctamente',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'No se pudo crear el perfil. Intenta de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View style={styles.stepContainer}>
            <Title style={styles.stepTitle}>Información básica</Title>
            <Paragraph style={styles.stepDescription}>
              Necesitamos algunos datos básicos para personalizar tu entrenamiento
            </Paragraph>

            <TextInput
              label="Edad"
              value={formData.age?.toString() || ''}
              onChangeText={(text) => updateFormData('age', parseInt(text) || undefined)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Peso (kg)"
              value={formData.weight?.toString() || ''}
              onChangeText={(text) => updateFormData('weight', parseFloat(text) || undefined)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <TextInput
              label="Altura (cm)"
              value={formData.height?.toString() || ''}
              onChangeText={(text) => updateFormData('height', parseFloat(text) || undefined)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContainer}>
            <Title style={styles.stepTitle}>Experiencia y disponibilidad</Title>
            <Paragraph style={styles.stepDescription}>
              Cuéntanos sobre tu experiencia y cuánto tiempo puedes dedicar
            </Paragraph>

            <Text style={styles.inputLabel}>Nivel de fitness</Text>
            <SegmentedButtons
              value={formData.fitness_level || 'beginner'}
              onValueChange={(value) => updateFormData('fitness_level', value as FitnessLevel)}
              buttons={[
                { value: 'beginner', label: 'Principiante' },
                { value: 'intermediate', label: 'Intermedio' },
                { value: 'advanced', label: 'Avanzado' },
              ]}
              style={styles.segmentedButton}
            />

            <TextInput
              label="Años de experiencia"
              value={formData.experience_years?.toString() || ''}
              onChangeText={(text) => updateFormData('experience_years', parseInt(text) || 0)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Días disponibles por semana</Text>
            <SegmentedButtons
              value={formData.available_days_per_week?.toString() || '3'}
              onValueChange={(value) => updateFormData('available_days_per_week', parseInt(value))}
              buttons={[
                { value: '2', label: '2' },
                { value: '3', label: '3' },
                { value: '4', label: '4' },
                { value: '5', label: '5' },
              ]}
              style={styles.segmentedButton}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContainer}>
            <Title style={styles.stepTitle}>Preferencias de entrenamiento</Title>
            <Paragraph style={styles.stepDescription}>
              Configura tus preferencias para el entrenamiento
            </Paragraph>

            <Text style={styles.inputLabel}>Duración preferida de sesión</Text>
            <SegmentedButtons
              value={formData.preferred_session_duration?.toString() || '30'}
              onValueChange={(value) => updateFormData('preferred_session_duration', parseInt(value))}
              buttons={[
                { value: '20', label: '20m' },
                { value: '30', label: '30m' },
                { value: '45', label: '45m' },
                { value: '60', label: '60m' },
              ]}
              style={styles.segmentedButton}
            />

            <Text style={styles.inputLabel}>Intensidad preferida</Text>
            <SegmentedButtons
              value={formData.preferred_intensity?.toString() || '0.7'}
              onValueChange={(value) => updateFormData('preferred_intensity', parseFloat(value))}
              buttons={[
                { value: '0.5', label: 'Baja' },
                { value: '0.7', label: 'Media' },
                { value: '0.8', label: 'Alta' },
                { value: '0.9', label: 'Muy alta' },
              ]}
              style={styles.segmentedButton}
            />

            <TextInput
              label="Porcentaje de grasa corporal (opcional)"
              value={formData.body_fat_percentage?.toString() || ''}
              onChangeText={(text) => updateFormData('body_fat_percentage', parseFloat(text) || undefined)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
            />
          </View>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.age && formData.weight && formData.height;
      case 2:
        return formData.fitness_level && formData.available_days_per_week !== undefined;
      case 3:
        return formData.preferred_session_duration && formData.preferred_intensity !== undefined;
      default:
        return false;
    }
  };

  const progress = step / 3;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <Title style={styles.title}>Configura tu perfil</Title>
          <Paragraph style={styles.subtitle}>
            Paso {step} de 3
          </Paragraph>
          <ProgressBar progress={progress} style={styles.progressBar} />
        </View>

        <Card style={styles.card}>
          <Card.Content>
            {renderStep()}

            <View style={styles.buttonContainer}>
              <Button
                mode="outlined"
                onPress={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                style={styles.button}
              >
                Anterior
              </Button>

              {step < 3 ? (
                <Button
                  mode="contained"
                  onPress={() => setStep(step + 1)}
                  disabled={!canProceed()}
                  style={styles.button}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  mode="contained"
                  onPress={handleSubmit}
                  disabled={!canProceed() || loading}
                  loading={loading}
                  style={styles.button}
                >
                  Completar
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  progressBar: {
    width: '100%',
    height: 8,
  },
  card: {
    elevation: 4,
  },
  stepContainer: {
    marginBottom: 30,
  },
  stepTitle: {
    fontSize: 20,
    marginBottom: 10,
  },
  stepDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  input: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  segmentedButton: {
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  button: {
    flex: 1,
    marginHorizontal: 5,
  },
});

export default OnboardingScreen;

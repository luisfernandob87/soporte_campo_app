import { Text, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useState } from 'react';
import { API_BASE_URL } from '../config';

export default function Welcome() {
  const { nombre, id_usuario } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  
  const updateLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso para acceder a la ubicación');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;    

      const response = await fetch(`${API_BASE_URL}/users/${id_usuario}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          latitud: latitude.toString(),
          longitud: longitude.toString(),  
        }),
      });

      if (!response.ok) {
        throw new Error('Error al actualizar la ubicación');
      }

      Alert.alert('Éxito', 'Ubicación actualizada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la ubicación');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    router.replace('/');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenido!</Text>
      <Text style={styles.name}>{nombre}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={updateLocation}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Actualizando...' : 'Actualizar Ubicación'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push({ pathname: '/casos', params: { id_usuario } })}
        >
          <Text style={styles.buttonText}>Ver mis casos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, styles.logoutButton]} 
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
 
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 20,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#007AFF',
  },
  name: {
    fontSize: 24,
    color: '#333',
  },
});
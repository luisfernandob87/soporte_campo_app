import { Text, View, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';

export default function DetalleCasos() {
  const { id_caso, id_usuario } = useLocalSearchParams();
  const [detalle, setDetalle] = useState({});
  const [loading, setLoading] = useState(true);
  const [etapaActual, setEtapaActual] = useState(1);
  const [estadoActual, setEstadoActual] = useState('');
  const [resolucion, setResolucion] = useState('');
  const router = useRouter();
  const determinarEtapa = (estado) => {
    switch (estado) {
      case 'Asignado': return 1;
      case 'Saliendo a sitio': return 2;
      case 'En sitio': return 3;
      case 'Soporte finalizado': return 4;
      case 'Resuelto': return 5;
      default: return 1;
    }
  };

  useEffect(() => {
    const fetchDetalleCaso = async () => {
      try {
        const response = await fetch(`http://192.168.1.14:4000/api/v1/casos/${id_caso}`);
        const data = await response.json();
        if (data.status === 'success') {
          setDetalle(data.data);
          setEstadoActual(data.data.caso.estadoCaso);
          setEtapaActual(determinarEtapa(data.data.caso.estadoCaso));
          setResolucion(data.data.caso.resolucion || '');
          setLoading(false);
          
        }
    } catch (error) {
        console.error('Error fetching detalle caso:', error);
        setLoading(false);
    }
};
fetchDetalleCaso();
}, [id_caso]);
// console.log(detalle.caso.status);

  const handleBack = () => {
    router.back();
  };

  const updateLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Error', 'Se requiere permiso para acceder a la ubicación');
        return false;
      }
  
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;    
  
      const response = await fetch('http://192.168.1.14:4000/api/v1/users/' + id_usuario, {
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
      return true;
    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar la ubicación');
      return false;
    }
  };

  const cambiarEstado = async (nuevoEstado, nuevaEtapa) => {
    try {
      await updateLocation();
      const response = await fetch(`http://192.168.1.14:4000/api/v1/casos/${id_caso}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estadoCaso: nuevoEstado }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setEstadoActual(nuevoEstado);
        setEtapaActual(nuevaEtapa);
        setDetalle({ ...detalle, caso: { ...detalle.caso, estadoCaso: nuevoEstado } });
      } else {
        Alert.alert('Error', 'No se pudo actualizar el estado del caso');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      Alert.alert('Error', 'Error al conectar con el servidor');
    }
  };

  const guardarResolucion = async () => {
    try {
      await updateLocation();
      const response = await fetch(`http://192.168.1.14:4000/api/v1/casos/${id_caso}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          estadoCaso: 'Resuelto',
          resolucion: resolucion,
          status: 'Resuelto'
        }),
      });

      const data = await response.json();
      if (data.status === 'success') {
        setEstadoActual('Resuelto');
        setEtapaActual(5);
        setDetalle({ ...detalle, caso: { ...detalle.caso, estadoCaso: 'Resuelto', resolucion: resolucion } });
        Alert.alert('Éxito', 'Caso resuelto correctamente');
      } else {
        Alert.alert('Error', 'No se pudo actualizar el caso');
      }
    } catch (error) {
      console.error('Error al guardar resolución:', error);
      Alert.alert('Error', 'Error al conectar con el servidor');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1976d2" />
        <Text style={styles.loadingText}>Procesando...</Text>
      </View>
    );
  }

  if (!detalle) {
    return <Text>Cargando...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ticket</Text>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>Ticket: {detalle.caso.ticket}</Text>
        <Text style={styles.infoDetail}>Estado del caso: {detalle.caso.estadoCaso}</Text>
        <Text style={styles.infoDetail}>Ultima actualización: {new Date(detalle.caso.updatedAt).toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      </View>
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarLabels}>
          <Text style={[styles.progressLabel, etapaActual >= 1 ? styles.progressLabelActive : null]}>Asignado</Text>
          <Text style={[styles.progressLabel, etapaActual >= 2 ? styles.progressLabelActive : null]}>Saliendo</Text>
          <Text style={[styles.progressLabel, etapaActual >= 3 ? styles.progressLabelActive : null]}>En sitio</Text>
          <Text style={[styles.progressLabel, etapaActual >= 4 ? styles.progressLabelActive : null]}>Finalizado</Text>
          <Text style={[styles.progressLabel, etapaActual >= 5 ? styles.progressLabelActive : null]}>Resuelto</Text>
        </View>
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${(etapaActual - 1) * 25}%` }]} />
        </View>
        <View style={styles.progressBarSteps}>
          <View style={[styles.progressStep, etapaActual >= 1 ? styles.progressStepCompleted : null]} />
          <View style={[styles.progressStep, etapaActual >= 2 ? styles.progressStepCompleted : null]} />
          <View style={[styles.progressStep, etapaActual >= 3 ? styles.progressStepCompleted : null]} />
          <View style={[styles.progressStep, etapaActual >= 4 ? styles.progressStepCompleted : null]} />
          <View style={[styles.progressStep, etapaActual >= 5 ? styles.progressStepCompleted : null]} />
        </View>
      </View>
      <View style={styles.botonesContainer}>
        <TouchableOpacity 
          style={[styles.botonEstado, estadoActual === "Saliendo a sitio" ? styles.botonActivo : null, etapaActual !== 1 ? styles.botonDeshabilitado : null]} 
          onPress={() => etapaActual === 1 ? cambiarEstado("Saliendo a sitio", 2) : null}
          disabled={etapaActual !== 1}
        >
          <Text style={[styles.botonTexto, etapaActual !== 1 ? styles.textoDeshabilitado : null]}>Saliendo a sitio</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.botonEstado, estadoActual === "En sitio" ? styles.botonActivo : null, etapaActual !== 2 ? styles.botonDeshabilitado : null]} 
          onPress={() => etapaActual === 2 ? cambiarEstado("En sitio", 3) : null}
          disabled={etapaActual !== 2}
        >
          <Text style={[styles.botonTexto, etapaActual !== 2 ? styles.textoDeshabilitado : null]}>En sitio</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.botonEstado, estadoActual === "Soporte finalizado" ? styles.botonActivo : null, etapaActual !== 3 ? styles.botonDeshabilitado : null]} 
          onPress={() => etapaActual === 3 ? cambiarEstado("Soporte finalizado", 4) : null}
          disabled={etapaActual !== 3}
        >
          <Text style={[styles.botonTexto, etapaActual !== 3 ? styles.textoDeshabilitado : null]}>Soporte finalizado</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.resolucionContainer}>
        <Text style={styles.resolucionLabel}>Resolución:</Text>
        <TextInput
          style={[styles.resolucionInput, etapaActual !== 4 ? styles.inputDeshabilitado : null]}
          multiline
          numberOfLines={8}
          placeholder="Ingrese la resolución del caso..."
          value={resolucion}
          onChangeText={setResolucion}
          editable={etapaActual === 4}
        />
        <TouchableOpacity 
          style={[styles.guardarButton, etapaActual !== 4 ? styles.botonDeshabilitado : null]} 
          onPress={guardarResolucion}
          disabled={etapaActual !== 4}
        >
          <Text style={[styles.guardarButtonText, etapaActual !== 4 ? styles.textoDeshabilitadoGuardar : null]}>Guardar resolución</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    marginRight: 10,
  },
  backButtonText: {
    fontSize: 18,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: '20%',
  },
  infoContainer: {
    padding: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  infoDetail: {
    fontSize: 14,
    marginBottom: 5,
  },
  estadoActual: {
    fontSize: 14,
    marginBottom: 5,
    color: '#1976d2',
  },
  progressBarContainer: {
    padding: 16,
    marginBottom: 10,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginVertical: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1976d2',
    borderRadius: 4,
  },
  progressBarSteps: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -12,
  },
  progressStep: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    borderWidth: 2,
    borderColor: '#fff',
  },
  progressStepCompleted: {
    backgroundColor: '#1976d2',
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
  progressLabelActive: {
    color: '#1976d2',
    fontWeight: 'bold',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#1976d2',
  },
  ubicacionContainer: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#e3f2fd',
    borderRadius: 4,
  },
  ubicacionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#0d47a1',
  },
  ubicacionDetail: {
    fontSize: 14,
    color: '#1565c0',
  },
  errorText: {
    marginTop: 8,
    color: '#d32f2f',
    fontSize: 14,
  },
  botonesContainer: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: 16,
    gap: 10,
  },
  botonEstado: {
    backgroundColor: '#e0e0e0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  botonActivo: {
    backgroundColor: '#1976d2',
  },
  botonTexto: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  botonDeshabilitado: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  textoDeshabilitado: {
    color: '#999',
  },
  textoDeshabilitadoGuardar: {
    color: '#fff',
    opacity: 0.6,
  },
  inputDeshabilitado: {
    backgroundColor: '#f0f0f0',
    opacity: 0.6,
  },
  resolucionContainer: {
    padding: 16,
    marginBottom: 20,
  },
  resolucionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resolucionInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    textAlignVertical: 'top',
    minHeight: 150,
    fontSize: 16,
  },
  guardarButton: {
    backgroundColor: '#4caf50',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  guardarButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
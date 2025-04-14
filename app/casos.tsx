import { Text, View, StyleSheet, Button, FlatList, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';


export default function Casos() {
  const router = useRouter();
  const [casos, setCasos] = useState([]);
  const { id_usuario } = useLocalSearchParams();

  useEffect(() => {
    const fetchCasos = async () => {
      try {
        const response = await fetch(`http://192.168.1.14:4000/api/v1/casos/caso/${id_usuario}`);
        const data = await response.json();
        if (data.status === 'success') {
          setCasos(data.data.caso);
        }
      } catch (error) {
        console.error('Error fetching casos:', error);
      }
    };
    fetchCasos();
  }, []);

  const [tiendas, setTiendas] = useState([]);

  useEffect(() => {
    const fetchTiendas = async () => {
      try {
        const response = await fetch('http://192.168.1.14:4000/api/v1/tiendas');
        const data = await response.json();
        if (data.status === 'success') {
          setTiendas(data.data.tiendas);
        }
      } catch (error) {
        console.error('Error fetching tiendas:', error);
      }
    };
    fetchTiendas();
  }, []);

  const getTiendaInfo = (idTienda) => {
    const tienda = tiendas.find(t => t.id_tienda === idTienda);
    return tienda ? `${tienda.cadena} - ${tienda.nombre}` : 'Tienda no encontrada';
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.itemContainer} onPress={() => router.push({ pathname: '/detalleCasos', params: { id_caso: item.id_caso, id_usuario: id_usuario },  })}>
      <Text style={styles.itemTitle}>Ticket: {item.ticket}</Text>
      <Text>Estado: {item.estadoCaso}</Text>
      <Text>Ultima actualización: {new Date(item.updatedAt).toLocaleString('es-GT', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
      <Text>Tienda: {getTiendaInfo(item.idTienda)}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Casos</Text>
      </View>
      <FlatList
        data={casos}
        renderItem={renderItem}
        keyExtractor={item => item.id_caso.toString()}
      />
    </View>
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
    // marginTop: 10,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    // marginLeft: 10,
    marginLeft: '20%',

  },
  itemContainer: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
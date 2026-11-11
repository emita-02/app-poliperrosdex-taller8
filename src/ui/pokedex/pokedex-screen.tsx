import { router } from 'expo-router';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';

import { PantallaLogin } from '@/app/(tabs)/login';
import { useEntrenador } from '@/ui/core/entrenador-view-model';
import { Estado } from '@/ui/core/estado';
import { colores, espacio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';

import { TarjetaPerro } from './tarjeta-perro';
import { usePokedexViewModel } from './use-pokedex-view-model';

// La pantalla se parte en dos porque un hook no puede llamarse de forma
// condicional: primero vemos si hay sesión y solo entonces creamos el
// ViewModel, que necesita el id del entrenador para consultar.
export function PokedexScreen() {
  const { entrenador, listo } = useEntrenador();

  if (!listo) return <Estado cargando />;
  if (!entrenador) return <PantallaLogin />;
  return <ListaPokedex entrenadorId={entrenador.id} nombre={entrenador.nombre} />;
}

type Props = { entrenadorId: string; nombre: string };

function ListaPokedex({ entrenadorId, nombre }: Props) {
  const { cerrarSesion } = useEntrenador();
  const vm = usePokedexViewModel(entrenadorId);

  if (vm.cargando || (vm.error && vm.perros.length === 0)) {
    return (
      <Estado cargando={vm.cargando} error={vm.error} onReintentar={vm.recargar} />
    );
  }

  return (
    <FlatList
      data={vm.perros}
      keyExtractor={(perro) => perro.id}
      contentContainerStyle={estilos.lista}
      ItemSeparatorComponent={() => <View style={{ height: espacio.s }} />}
      ListHeaderComponent={
        <View style={estilos.cabecera}>
          <Texto variante="nota">Entrenador: {nombre}</Texto>
          <Texto variante="subtitulo">{vm.resumen}</Texto>
          <Pressable onPress={cerrarSesion} hitSlop={8}>
            <Texto variante="nota" style={estilos.enlace}>
              Cerrar sesión
            </Texto>
          </Pressable>
        </View>
      }
      renderItem={({ item }) => (
        <TarjetaPerro
          perro={item}
          capturado={vm.estaCapturado(item.id)}
          onPress={() =>
            router.push({ pathname: '/perro/[id]', params: { id: item.id } })
          }
        />
      )}
    />
  );
}

const estilos = StyleSheet.create({
  lista: { padding: espacio.m },
  cabecera: { gap: espacio.xs, marginBottom: espacio.m },
  enlace: { color: colores.terracota, textDecorationLine: 'underline' },
});
import { StyleSheet, View } from 'react-native';

import { Boton } from '@/ui/core/boton';
import { useEntrenador } from '@/ui/core/entrenador-view-model';
import { colores, espacio } from '@/ui/core/tema';
import { Texto } from '@/ui/core/texto';

import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();
// Reemplaza a FormularioApodo. Ya no hay nada que validar aquí: la
// identidad la garantiza Google, y la base de datos la comprueba con RLS.
export function PantallaLogin() {
  const { iniciarSesion, entrando, error } = useEntrenador();

  return (
    <View style={estilos.caja}>
      <Texto variante="subtitulo">Entra para capturar</Texto>
      <Texto variante="nota">
        Tus capturas quedan ligadas a tu cuenta de Google. Los demás
        entrenadores solo verán tu primer nombre.
      </Texto>
      {error && <Texto style={{ color: colores.alerta }}>{error}</Texto>}
      <Boton
        titulo={entrando ? 'Abriendo Google…' : 'Continuar con Google'}
        onPress={iniciarSesion}
        deshabilitado={entrando}
      />
    </View>
  );
}

const estilos = StyleSheet.create({
  caja: { gap: espacio.m, padding: espacio.l },
});

// Modelo de dominio: quién está jugando.
// No sabe que existe Google ni Supabase; lo usan todas las capas.
export type Entrenador = {
  id: string;
  nombre: string;
};
// storage/players.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const PLAYERS_KEY = 'players_list';

export type Player = {
  id: string;
  name: string;
};

export async function getPlayers() {
  const json = await AsyncStorage.getItem(PLAYERS_KEY);
  return json ? JSON.parse(json) : [];
}

export async function addPlayer(newPlayer) {
  const existing = await getPlayers();
  const updated = [...existing, newPlayer];
  await AsyncStorage.setItem(PLAYERS_KEY, JSON.stringify(updated));
}
import * as Font from "expo-font";
import { Stack } from "expo-router";
import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { COLORS } from "../constants/colors";
import { NotesProvider } from "../context/NotesContext";

export default function RootLayout() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      await Font.loadAsync({
        "Geo": require("../assets/Geo-Regular.ttf"), 
        "PlayWriteCZ" : require("../assets/PlaywriteCZ-Regular.ttf")
      });
      setFontsLoaded(true);
    }
    loadFonts();
  }, []);

  if (!fontsLoaded) return null;

  return (
    <NotesProvider>
      <StatusBar barStyle="light-content" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.bg } }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="note/[id]" options={{ presentation: 'card' }} /> 
        <Stack.Screen name="add" options={{ presentation: 'modal' }} />
      </Stack>
    </NotesProvider>
  );
}
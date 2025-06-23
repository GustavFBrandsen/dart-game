import React from 'react';
import { StyleSheet, Switch, Text, View } from 'react-native';
import Footer from '../components/Footer';

export default function SettingsScreen() {
  const [soundEnabled, setSoundEnabled] = React.useState(true);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <View style={styles.settingRow}>
        <Text style={styles.settingLabel}>Sound</Text>
        <Switch
          value={soundEnabled}
          onValueChange={setSoundEnabled}
        />
      </View>
      {/* Add more settings here */}
        <Footer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 50,
    height: '100%',
    // flex: 1,
    // padding: 24,
    // backgroundColor: '#f8f8f8',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  settingLabel: {
    fontSize: 18,
  },
});
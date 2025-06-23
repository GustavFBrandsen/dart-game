import { useNavigation } from '@react-navigation/native';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { Button, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import ModeToggle from '../components/ModeToggle';
import PlayerSelector from '../components/PlayerSelector';

// Team colors for visualization
const TEAM_COLORS = ['#FF9999', '#99CCFF', '#99FF99', '#FFCC99', '#CC99FF'];

type Player = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  color: string;
  players: Player[];
};

export default function HomeScreen() {
  const [mode, setMode] = useState<'solo' | 'duos'>('solo');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>([]);
  const [assignedPlayerColors, setAssignedPlayerColors] = useState<Record<string, string>>({});
  const navigation = useNavigation();
  
  // Team capacity (1 for solo, 2 for duos)
  const teamCapacity = mode === 'solo' ? 1 : 2;
  
  // Reset state when mode changes
  useEffect(() => {
    setTeams([]);
    setCurrentTeamIndex(0);
    setSelectedPlayers([]);
    setAssignedPlayerIds([]);         // Clear assigned player IDs
    setAssignedPlayerColors({});      // Clear assigned player colors
  }, [mode]);

  // Create a new team
  const createNewTeam = () => {
    const newTeam = {
      id: Crypto.randomUUID(),
      color: TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length],
      players: []
    };
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  // Handle player selection
  const handlePlayerSelect = (players: Player[]) => {
    setSelectedPlayers(players);
  };

  // Assign selected players to current team (only for duos)
  const assignToTeam = () => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    let updatedTeams = [...teams];
    let fillingHole = false;

    // If the current team slot doesn't exist, create it
    if (!updatedTeams[currentTeamIndex]) {
      const newTeam = {
        id: Crypto.randomUUID(),
        color: TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length],
        players: [],
      };
      updatedTeams[currentTeamIndex] = newTeam;
    }

    // If the current team is empty, we're filling a hole
    if (updatedTeams[currentTeamIndex].players.length === 0) {
      fillingHole = true;
    }

    // Assign selected players to the current team slot
    updatedTeams[currentTeamIndex] = {
      ...updatedTeams[currentTeamIndex],
      players: [...selectedPlayers],
    };

    setTeams(updatedTeams);

    setAssignedPlayerIds(prev => [
      ...prev,
      ...selectedPlayers.map(p => p.id)
    ]);

    setSelectedPlayers([]);

    // If we just filled a previously empty team, jump to the end
    if (fillingHole) {
      setCurrentTeamIndex(updatedTeams.length);
    } else {
      setCurrentTeamIndex(prev => prev + 1);
    }

    // Build a map of assigned playerId to their team color
    const assignedPlayerColors = updatedTeams.reduce((acc, team) => {
      team.players.forEach(player => {
        acc[player.id] = team.color;
      });
      return acc;
    }, {} as Record<string, string>);

    setAssignedPlayerColors(assignedPlayerColors);
  };

  const startGame = () => {
    if (teams.length === 0) {
      alert('Please create at least one team');
      return;
    }

    navigation.navigate('Game', { 
      mode, 
      teams,
      teamCapacity 
    });
  };

  const teamTitle = mode === 'solo' 
    ? 'Select players' 
    : `Select players for Team ${currentTeamIndex + 1}`;

  // Auto-assign when team is full (only in duos mode)
  useEffect(() => {
    if (selectedPlayers.length === teamCapacity) {
      assignToTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayers, teamCapacity, mode]);

  const handleAssignedPlayerPress = (player: Player) => {
    // Find the team index this player was in
    const teamIndex = teams.findIndex(team => team.players.some(p => p.id === player.id));

    // Remove player from all teams, but DO NOT filter out empty teams
    const updatedTeams = teams.map(team => ({
      ...team,
      players: team.players.filter(p => p.id !== player.id)
    }));

    setTeams(updatedTeams);

    // Remove from assignedPlayerIds
    setAssignedPlayerIds(prev => prev.filter(id => id !== player.id));

    // Remove from assignedPlayerColors
    setAssignedPlayerColors(prev => {
      const newColors = { ...prev };
      delete newColors[player.id];
      return newColors;
    });

    // Remove from selectedPlayers if present
    setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));

    // Set currentTeamIndex to the team that was just emptied (if it still exists)
    if (teamIndex !== -1) {
      setCurrentTeamIndex(teamIndex);
    } else {
      setCurrentTeamIndex(updatedTeams.length);
    }
  };

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
        <ModeToggle mode={mode} onChange={setMode} />
        <Text style={{ marginTop: 20, fontSize: 18 }}>
        </Text>
      </View>
      <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 }}>
        Team {currentTeamIndex}: {teams[currentTeamIndex-1]?.players.map(p => p.name).join(', ')}
      </Text>
      
      <PlayerSelector 
        title={teamTitle}
        teamColor={TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length]}
        selectedPlayers={selectedPlayers}
        assignedPlayerIds={assignedPlayerIds}
        assignedPlayerColors={assignedPlayerColors} // <-- pass this prop
        onSelectionChange={handlePlayerSelect}
        onAssignedPlayerPress={handleAssignedPlayerPress}
        maxPlayers={teamCapacity}
        allPlayers={allPlayers}
        setAllPlayers={setAllPlayers}
      />

      <View style={styles.buttonRow}>
        <View style={styles.buttonSpacer} />
        <Button 
          title="Start Game" 
          onPress={startGame} 
          disabled={teams.length === 0} 
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  teamsContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  teamsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  teamBadge: {
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
  teamText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  buttonSpacer: {
    width: 10,
  },
});
/**
 * @file teamService.js
 * @description Team composition rules, member mapping, and size enforcement
 */

import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { store } from '../store/dataStore.js';

export class TeamService {
  /**
   * Validate strict team size rules (5 or 6 players)
   */
  validateTeamSize(size) {
    const min = EVENT_CONFIG.teamConfig.minPlayers; // 5
    const max = EVENT_CONFIG.teamConfig.maxPlayers; // 6
    if (typeof size !== 'number' || size < min || size > max) {
      throw new Error(`Invalid team size (${size}). DECEPTION teams must contain strictly 5 or 6 players.`);
    }
    return true;
  }

  async createTeam({ teamName, players, registrationId }) {
    this.validateTeamSize(players.length);

    const teamId = `TEAM-${Date.now().toString().slice(-5)}`;
    const memberIds = players.map(p => p._id);
    const leaderId = players[0]._id;

    const team = {
      _id: `team_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      teamId,
      name: teamName.trim(),
      gameId: 'game_deception_2026',
      registrationId,
      teamSize: players.length,
      leaderId,
      memberIds,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    store.teams.push(team);

    // Create TeamMembers
    players.forEach((p, idx) => {
      store.teamMembers.push({
        _id: `tm_${Date.now()}_${idx}`,
        teamId: team._id,
        studentId: p._id,
        role: idx === 0 ? 'LEADER' : 'MEMBER'
      });
    });

    return team;
  }

  async getTeamByRegistrationId(registrationId) {
    return store.teams.find(t => t.registrationId === registrationId) || null;
  }

  async getAllTeams() {
    return store.teams;
  }
}

export const teamService = new TeamService();
export default teamService;

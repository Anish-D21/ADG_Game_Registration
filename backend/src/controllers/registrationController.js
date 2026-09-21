/**
 * @file registrationController.js
 * @description HTTP Handlers for public team registrations, game info & tickets
 */

import { registrationService } from '../services/registrationService.js';
import { ticketService } from '../services/ticketService.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { store } from '../store/dataStore.js';

export async function getGameInfo(req, res) {
  try {
    return res.json({
      success: true,
      game: EVENT_CONFIG
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function createRegistration(req, res) {
  try {
    const result = await registrationService.registerTeam(req.body);
    return res.status(201).json(result);
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
}

export async function getRegistration(req, res) {
  try {
    const { id } = req.params;
    const details = await registrationService.getRegistrationDetails(id);

    if (!details) {
      return res.status(404).json({ success: false, message: `Registration with ID "${id}" was not found.` });
    }

    return res.json({
      success: true,
      ...details
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTicketInfo(req, res) {
  try {
    const { registrationId } = req.params;
    const ticket = await ticketService.getTicket(registrationId);

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: 'Ticket is only generated after registration is verified and payment is marked as PAID.'
      });
    }

    return res.json({
      success: true,
      ticket
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

/**
 * @file registrationController.js
 * @description HTTP Handlers for public team registrations, game info & tickets
 */

import { registrationService } from '../services/registrationService.js';
import { ticketService } from '../services/ticketService.js';
import { EVENT_CONFIG } from '../../../shared/eventConfig.js';
import { perHeadAmount, currency, expectedAmountForTeamSize } from '../utils/fees.js';
import { store } from '../store/dataStore.js';


/**
 * Stamp the live fee into the config before it leaves the server.
 *
 * The browser bundles eventConfig at build time, so anything it reads from there is
 * frozen at whatever the defaults were. Substituting here means PER_HEAD_AMOUNT in the
 * environment is the only place the number exists - rules copy and FAQ answers included.
 */
function withLiveFees(config) {
  const per = perHeadAmount();
  const cur = currency();
  const tokens = {
    '{{PER_HEAD}}': String(per),
    '{{CURRENCY}}': cur,
    '{{TEAM_5}}': `${cur} ${expectedAmountForTeamSize(config.teamConfig.minPlayers)}`,
    '{{TEAM_6}}': `${cur} ${expectedAmountForTeamSize(config.teamConfig.maxPlayers)}`
  };

  const fill = value => {
    if (typeof value === 'string') {
      return Object.entries(tokens).reduce((out, [k, v]) => out.split(k).join(v), value);
    }
    if (Array.isArray(value)) return value.map(fill);
    if (value && typeof value === 'object') {
      return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v)]));
    }
    return value;
  };

  const filled = fill(config);
  filled.registrationConfig = {
    ...filled.registrationConfig,
    perHeadAmount: per,
    currency: cur,
    minTeamAmount: expectedAmountForTeamSize(config.teamConfig.minPlayers),
    maxTeamAmount: expectedAmountForTeamSize(config.teamConfig.maxPlayers)
  };
  return filled;
}

export async function getGameInfo(req, res) {
  try {
    const { slug } = req.params;
    if (slug && slug.toLowerCase() !== EVENT_CONFIG.slug.toLowerCase()) {
      return res.status(404).json({ success: false, message: `No game found with slug "${slug}".` });
    }

    return res.json({
      success: true,
      game: withLiveFees(EVENT_CONFIG),
      paymentConfig: {
        // Drives which payment options the registration form is allowed to offer.
        mockEnabled: process.env.MOCK_PAYMENT === 'true',
        upiVpa: process.env.UPI_VPA || '',
        payeeName: process.env.UPI_PAYEE_NAME || 'ADG DECEPTION',
        perHeadAmount: perHeadAmount(),
        currency: currency(),
        minTeamAmount: expectedAmountForTeamSize(EVENT_CONFIG.teamConfig.minPlayers),
        maxTeamAmount: expectedAmountForTeamSize(EVENT_CONFIG.teamConfig.maxPlayers)
      }
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

/**
 * Registration IDs run in sequence, so this endpoint can be walked. It must not hand
 * out contact details in full or every team leader's email and phone can be harvested
 * by counting upwards. Masked values still let a student recognise their own squad,
 * and knowing the FULL email is what proves ownership when submitting a payment.
 */
function maskEmail(email) {
  const [user = '', domain = ''] = String(email || '').split('@');
  if (!domain) return '';
  const head = user.slice(0, 2);
  return `${head}${'*'.repeat(Math.max(3, user.length - 2))}@${domain}`;
}

function maskMobile(mobile) {
  const digits = String(mobile || '').replace(/\D/g, '');
  if (digits.length < 4) return '';
  return `${'*'.repeat(digits.length - 4)}${digits.slice(-4)}`;
}

export async function getRegistration(req, res) {
  try {
    const { id } = req.params;
    const details = await registrationService.getRegistrationDetails(id);

    if (!details) {
      return res.status(404).json({ success: false, message: `Registration with ID "${id}" was not found.` });
    }

    const safe = { ...details };

    // The pass travels in this response too, so gating /tickets alone would leave the
    // door open. Withhold it unless the caller proves ownership the same way.
    const claimedEmail = String(req.query.contactEmail || '').trim().toLowerCase();
    const ownsSquad = claimedEmail &&
      claimedEmail === String(details.registration?.contactEmail || '').trim().toLowerCase();
    if (!ownsSquad) {
      safe.ticket = null;
      safe.ticketLocked = true;
    }
    if (safe.registration) {
      safe.registration = {
        ...safe.registration,
        contactEmail: maskEmail(safe.registration.contactEmail),
        contactMobile: maskMobile(safe.registration.contactMobile)
      };
    }
    // Player rows carry the same details for the whole squad.
    for (const key of ['students', 'players', 'members']) {
      if (Array.isArray(safe[key])) {
        safe[key] = safe[key].map(pl => ({
          ...pl,
          email: maskEmail(pl.email),
          mobile: maskMobile(pl.mobile)
        }));
      }
    }

    return res.json({
      success: true,
      ...safe
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function getTicketInfo(req, res) {
  try {
    const { registrationId } = req.params;

    // The QR pass is what gets someone through the door, and registration IDs run in
    // sequence, so this cannot be readable by counting upwards. Knowing the leader's
    // full email is the proof of ownership - the public lookup only returns it masked.
    const claimed = String(req.query.contactEmail || req.body?.contactEmail || '').trim().toLowerCase();
    const reg = store.registrations.find(r => r.registrationId === registrationId);
    if (!reg) {
      return res.status(404).json({ success: false, message: `Registration "${registrationId}" was not found.` });
    }
    if (!claimed || claimed !== String(reg.contactEmail || '').trim().toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: "Enter the team leader's email address to view this squad's entry pass."
      });
    }

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

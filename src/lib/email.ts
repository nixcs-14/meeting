// Récupérer la liste des AAF
export function getAAFList(): string[] {
  const { getWhitelist } = require('./constants');
  return getWhitelist();
}

// Construire une URL mailto
export function buildMailToUrl({
  to,
  subject,
  body,
  cc,
  bcc,
}: {
  to: string | string[];
  subject: string;
  body: string;
  cc?: string | string[];
  bcc?: string | string[];
}): string {
  const params = new URLSearchParams();
  
  const recipients = Array.isArray(to) ? to.join(',') : to;
  params.set('to', recipients);
  
  params.set('subject', subject);
  params.set('body', body);
  
  if (cc) {
    params.set('cc', Array.isArray(cc) ? cc.join(',') : cc);
  }
  if (bcc) {
    params.set('bcc', Array.isArray(bcc) ? bcc.join(',') : bcc);
  }
  
  return `mailto:${recipients}?${params.toString()}`;
}

// Ouvrir le client email avec mailto:
export function openMailClient(url: string): boolean {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
    console.log('📧 Ouverture du client email avec:', url);
    return true;
  }
  console.log('📧 [SERVER] Email à envoyer:', url);
  return true;
}

// Notifier uniquement le propriétaire de la réservation (pour la négociation)
export function notifyOwner(
  ownerEmail: string,
  requesterName: string,
  title: string,
  proposedDate: string,
  proposedStartTime: string,
  proposedEndTime: string,
  message?: string
) {
  const subject = `🤝 Demande de modification de réservation`;

  const body = `
📅 SALLE DE RÉUNION UNDP
${'='.repeat(50)}

🤝 Demande de modification de réservation

${requesterName} propose une modification pour la réservation "${title}"

📌 Objet : ${title}
👤 Demandeur : ${requesterName}
📅 Date proposée : ${new Date(proposedDate).toLocaleDateString('fr-FR', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric' 
})}
🕐 Horaire proposé : ${proposedStartTime} – ${proposedEndTime}
💬 Message : ${message || 'Aucun message'}

${'='.repeat(50)}
🔗 Connectez-vous pour accepter ou refuser : ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

Ce message est une notification automatique.
  `.trim();

  const mailtoUrl = buildMailToUrl({
    to: ownerEmail,
    subject,
    body: encodeURIComponent(body),
  });

  return openMailClient(mailtoUrl);
}

// Envoyer une invitation aux participants (mailto)
export function inviteParticipants(
  creatorEmail: string,
  participants: string[],
  title: string,
  date: string,
  startTime: string,
  endTime: string
) {
  if (!participants || participants.length === 0) return;

  const subject = `📅 Invitation : ${title}`;

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  const body = `
📅 SALLE DE RÉUNION UNDP
${'='.repeat(50)}

📩 Invitation à une réunion

📌 Objet : ${title}
👤 Organisateur : ${creatorEmail}
📅 Date : ${formattedDate}
🕐 Horaire : ${startTime} – ${endTime}

${'='.repeat(50)}
🔗 Accéder au tableau de bord : ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard

Merci de confirmer votre présence.
  `.trim();

  const mailtoUrl = buildMailToUrl({
    to: participants,
    subject,
    body: encodeURIComponent(body),
    cc: creatorEmail,
  });

  return openMailClient(mailtoUrl);
}

// Notification au créateur (confirmation)
export function notifyCreator(
  email: string,
  title: string,
  date: string,
  startTime: string,
  endTime: string,
  participants?: string[]
) {
  const subject = `✅ Réservation confirmée : ${title}`;

  const formattedDate = new Date(date).toLocaleDateString('fr-FR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  let body = `
📅 SALLE DE RÉUNION UNDP
${'='.repeat(50)}

✅ Votre réservation a été confirmée

📌 Objet : ${title}
📅 Date : ${formattedDate}
🕐 Horaire : ${startTime} – ${endTime}
  `.trim();

  if (participants && participants.length > 0) {
    body += `\n\n👥 Participants : ${participants.join(', ')}`;
  }

  body += `

${'='.repeat(50)}
🔗 Accéder au tableau de bord : ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard
  `.trim();

  const mailtoUrl = buildMailToUrl({
    to: email,
    subject,
    body: encodeURIComponent(body),
  });

  return openMailClient(mailtoUrl);
}
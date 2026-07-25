const express = require('express');

const app = express();
app.use(express.json());

const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

/**
 * Route de vérification du webhook par Meta
 */
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (!verifyToken) {
    console.error('La variable VERIFY_TOKEN est absente.');
    return res.sendStatus(500);
  }

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }

  console.error('Échec de vérification du webhook.');
  return res.sendStatus(403);
});

/**
 * Réception des événements WhatsApp
 */
app.post('/', (req, res) => {
  // Répondre rapidement à Meta
  res.sendStatus(200);

  try {
    const body = req.body;

    console.log(
      `Webhook reçu le ${new Date().toISOString()}`,
      JSON.stringify(body, null, 2)
    );

    if (body.object !== 'whatsapp_business_account') {
      console.log('Événement ignoré : objet non reconnu.');
      return;
    }

    const changes = body.entry?.[0]?.changes?.[0];
    const value = changes?.value;

    // Message reçu d’un utilisateur
    const message = value?.messages?.[0];

    if (message) {
      const senderPhone = message.from;
      const messageType = message.type;

      console.log('Nouveau message WhatsApp :');
      console.log('Expéditeur :', senderPhone);
      console.log('Type :', messageType);

      if (messageType === 'text') {
        console.log('Texte :', message.text?.body);
      }

      return;
    }

    // Changement de statut d’un message envoyé
    const status = value?.statuses?.[0];

    if (status) {
      console.log('Mise à jour du statut :');
      console.log('Message ID :', status.id);
      console.log('Statut :', status.status);
      console.log('Destinataire :', status.recipient_id);
    }
  } catch (error) {
    console.error('Erreur pendant le traitement du webhook :', error);
  }
});

/**
 * Route facultative de contrôle
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'WhatsApp webhook',
  });
});

app.listen(port, () => {
  console.log(`Serveur démarré sur le port ${port}`);
});

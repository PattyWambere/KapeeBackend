import { Request, Response } from "express";
import { userModel } from "../models/user.model";
import Stripe from "stripe";

// Initialize Stripe (must be configured for this feature to work)
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Saved payment method management (Stripe)
 */

/**
 * Helper: ensure the user has a Stripe Customer record
 */
async function ensureStripeCustomer(userId: string): Promise<string> {
  if (!stripe) throw new Error("Stripe is not configured");

  const user = await userModel.findById(userId);
  if (!user) throw new Error("User not found");

  // Return existing Stripe Customer ID
  if (user.stripeCustomerId) return user.stripeCustomerId;

  // Create a new Stripe Customer
  const customer = await stripe.customers.create({
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    metadata: { userId: user._id.toString() },
  });

  // Save the Stripe Customer ID to our database
  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

/**
 * POST /api/payments/setup-intent
 * Creates a SetupIntent so the client can securely save a card via Stripe Elements
 */
/**
 * @swagger
 * /api/payments/setup-intent:
 *   post:
 *     summary: Create a SetupIntent to save a card
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: SetupIntent created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 clientSecret:
 *                   type: string
 *       400:
 *         description: Stripe not configured
 */
export const createSetupIntent = async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(400).json({
        message: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env",
      });
    }

    const userId = (req as any).userId;
    const stripeCustomerId = await ensureStripeCustomer(userId);

    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ["card"],
    });

    return res.json({ clientSecret: setupIntent.client_secret });
  } catch (error: any) {
    console.error("Create SetupIntent error:", error);
    return res.status(500).json({ message: error.message || "Failed to create setup intent" });
  }
};

/**
 * GET /api/payments/payment-methods
 * List all saved cards for the authenticated user
 */
/**
 * @swagger
 * /api/payments/payment-methods:
 *   get:
 *     summary: List saved payment methods
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved cards
 */
export const getPaymentMethods = async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(400).json({ message: "Stripe is not configured" });
    }

    const userId = (req as any).userId;
    const user = await userModel.findById(userId);

    if (!user?.stripeCustomerId) {
      return res.json({ paymentMethods: [], defaultPaymentMethodId: null });
    }

    // Get all card payment methods for this customer
    const paymentMethods = await stripe.paymentMethods.list({
      customer: user.stripeCustomerId,
      type: "card",
    });

    // Get the default payment method from the customer object
    const customer = await stripe.customers.retrieve(user.stripeCustomerId);
    const defaultPmId =
      typeof customer !== "string" && !customer.deleted
        ? (customer.invoice_settings?.default_payment_method as string) || null
        : null;

    const cards = paymentMethods.data.map((pm) => ({
      id: pm.id,
      brand: pm.card?.brand || "unknown",
      last4: pm.card?.last4 || "****",
      expMonth: pm.card?.exp_month,
      expYear: pm.card?.exp_year,
      isDefault: pm.id === defaultPmId,
    }));

    return res.json({ paymentMethods: cards, defaultPaymentMethodId: defaultPmId });
  } catch (error: any) {
    console.error("Get payment methods error:", error);
    return res.status(500).json({ message: error.message || "Failed to fetch payment methods" });
  }
};

/**
 * DELETE /api/payments/payment-methods/:id
 * Remove a saved card
 */
/**
 * @swagger
 * /api/payments/payment-methods/{id}:
 *   delete:
 *     summary: Remove a saved payment method
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment method removed
 *       404:
 *         description: Payment method not found
 */
export const deletePaymentMethod = async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(400).json({ message: "Stripe is not configured" });
    }

    const { id } = req.params;

    // Detach the payment method from the customer (doesn't delete, just unlinks)
    await stripe.paymentMethods.detach(id);

    return res.json({ message: "Payment method removed successfully" });
  } catch (error: any) {
    console.error("Delete payment method error:", error);
    return res.status(500).json({ message: error.message || "Failed to remove payment method" });
  }
};

/**
 * PUT /api/payments/payment-methods/:id/default
 * Set a card as the default payment method
 */
/**
 * @swagger
 * /api/payments/payment-methods/{id}/default:
 *   put:
 *     summary: Set a payment method as default
 *     tags: [Payments]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Default payment method updated
 */
export const setDefaultPaymentMethod = async (req: Request, res: Response) => {
  try {
    if (!stripe) {
      return res.status(400).json({ message: "Stripe is not configured" });
    }

    const userId = (req as any).userId;
    const { id } = req.params;

    const stripeCustomerId = await ensureStripeCustomer(userId);

    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: id },
    });

    return res.json({ message: "Default payment method updated" });
  } catch (error: any) {
    console.error("Set default payment method error:", error);
    return res.status(500).json({ message: error.message || "Failed to set default payment method" });
  }
};

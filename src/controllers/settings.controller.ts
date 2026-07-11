import { Request, Response } from "express";
import { SettingsModel } from "../models/settings.model";

/**
 * GET SETTINGS
 * Public or Admin access
 */
export const getSettings = async (req: Request, res: Response) => {
  let settings = await SettingsModel.findOne();
  
  if (!settings) {
    // Create default settings if none exist
    settings = await SettingsModel.create({ freeShippingThreshold: 120 });
  }

  res.json(settings);
};

/**
 * UPDATE SETTINGS
 * Protected
 * Role: Admin
 */
export const updateSettings = async (req: Request, res: Response) => {
  const { freeShippingThreshold } = req.body;

  const thresholdNum = Number(freeShippingThreshold);
  if (freeShippingThreshold !== undefined && (isNaN(thresholdNum) || thresholdNum < 0)) {
    return res.status(400).json({ message: "Free shipping threshold must be a valid positive number" });
  }

  let settings = await SettingsModel.findOne();

  if (!settings) {
    settings = await SettingsModel.create({ freeShippingThreshold: thresholdNum });
  } else {
    settings.freeShippingThreshold = thresholdNum;
    await settings.save();
  }

  res.json(settings);
};

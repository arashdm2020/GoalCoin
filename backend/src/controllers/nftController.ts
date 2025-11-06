import { Request, Response } from 'express';

export const nftController = {
  async placeholder(req: Request, res: Response) {
    res.status(200).json({
      network: 'polygon-amoy',
      status: 'placeholder',
    });
  },
};

import { Request, Response } from 'express';

export const storeController = {
  async embed(req: Request, res: Response) {
    const payload = {
      shopify_tab_url: process.env.SHOPIFY_TAB_URL || '',
      store_embed_html: process.env.STORE_EMBED_HTML || '',
      status: 'placeholder',
    };
    res.status(200).json(payload);
  },
};

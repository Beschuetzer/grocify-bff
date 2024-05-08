/**
*These are the routes around interacting with the mongodb database
**/
import express from "express";
import { getRandomInt } from "../helpers";
import { Item } from "../schema";

const router = express.Router({
    mergeParams: true,
});

router.get('/mockCreation', async (req, res) => {
    const createdItem = new Item({
      addedDate: Date.now() - getRandomInt(1000000, 1000000000),
      frequency: getRandomInt(1, 10),
      unit: 'day',
      name: "test item",
      upc: getRandomInt(1, 999999999999).toString().padStart(12, '0'),
      images: ['www.test.com'],
      imageToUseIndex: 0,
      fullscreenImage: 'www.test.com',
      lastUpdatedDate: Date.now(),
    })

    try {
      await createdItem.save();
      res.send({createdItem})
    } catch (error) {
      res.send({error})    
    }
  })
 
export default router;


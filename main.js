

/**
 * 
    The below scenarios are designed as a 60-minute assignment in which you are supposed to code and develop an application according to the given instructions.

• Create a Node web application which serves 3 APIs .
i. First API
 Return the below details for a given cocktail name( or partial name)
Output:
{​
"idDrink": "123",
"strDrink": "CocktailName",
"strCategory": "Ordinary Drink",
"strIngredient1": "Lemon juice",
"strIngredient2": "Strawberries",
"strIngredient3": "Salt",
"strIngredient4": "Lime juice",
"strIngredient5": "Strawberries",
"strIngredient6": "Salt"
}​
 Fetch the cocktail details from the below URL internally
https://www.thecocktaildb.com/api/json/v1/1/search.php?s=cocktailName
 Take first result
 Use one of these valid names "Margarita","Coco","Moon"


ii. Second API
 Return the price list details of the cocktails from the static file given.
Sample Output:
{
"drinks": [
{
"idDrink": "11007",
"drinkName": "Margarita",
"price": "3",
"units":"dollar"
},
{
"idDrink": "178354",
"drinkName": "Pink Moon",
"price": "7",
"units":"dollar"
},
{
"idDrink": "12744",
"drinkName": "Microwave Hot Cocoa",
"price": "5",
"units":"dollar"
}]
}


iii. Third API
 For the given list of drinks that are available in Pricelist static JSON file, list down the drinks which contain one of the ingredient as "Lime Juice" with rest of the ingredients and price.
Sample Output:
"drinks": [
{
"idDrink": "11007",
"drinkName": "Margarita",
"price": "2",
"units":"dollar",
"strIngredient1": "Lemon juice",
"strIngredient2": "Strawberries",
"strIngredient3": "Salt",
"strIngredient4": "Lime juice",
"strIngredient5": "Strawberries",
"strIngredient6": "Salt"
},
{
"idDrink": "178354",
"drinkName": "Pink Moon",
"price": "5",
"units":"dollar",
"strIngredient1": "Lemon juice",
"strIngredient2": "Strawberries",
"strIngredient3": "Salt",
"strIngredient4": "Lime juice",
"strIngredient5": "Strawberries",
"strIngredient6": "Salt"
}]
}
iv. Implement in-memory cache for 10 minutes
Please consider scalability and clean design while creating the application.
 */

const express = require('express');
const app = express();
const request = require('request');
const fs = require('fs');
const async = require('async');


const getDrinksFromServer = async (name) => {
 return new Promise((resolve, reject) => {
    request.get(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${name}`, function(err, data) {
        
        let drinksObject = JSON.parse(data.body);
        if (Array.isArray(drinksObject.drinks) && drinksObject.drinks.length) {
            let drink = drinksObject.drinks[0];
            let responseData = {
                    idDrink: drink.idDrink,
                    strDrink: drink.strDrink,
                    strCategory: drink.strCategory,
                    strIngredient1: drink.strIngredient1,
                    strIngredient2: drink.strIngredient2,
                    strIngredient3: drink.strIngredient3,
                    strIngredient4: drink.strIngredient4,
                    strIngredient5: drink.strIngredient5,
                    strIngredient6: drink.strIngredient6
            };
            resolve(responseData);
        } else {
            reject(new Error('Failed to Fetch from Server'));
        }
      }); 
 });
};
app.get('/cocktail/:name', async function(req, res) {
    const name = req.params.name;
    if (name) {
        try {
            let drinksObject = await getDrinksFromServer(name);
            res.json({success: 'Found', data: drinksObject });   
        } catch(error) {
          console.error(error);
          res.send({ Error: error.message });
        }      
    }
});


app.get('/cocktailprice', function(req, res) {
  const filename = './drinkPriceList.json';
  fs.readFile(filename, { encoding: 'utf-8'},(err, data) => {
    res.json(JSON.parse(data));
  });
});

app.get('/cocktailbyIngredient/:ingredient', function(req, res) {
    const ingredient = req.params.ingredient;
    const filename = './drinkPriceList.json';
    fs.readFile(filename, { encoding: 'utf-8'},(err, data) => {
      let drinksObject = JSON.parse(data);
      let drinkNames = drinksObject.drinks.map(drink => drink.drinkName);
      let allDrinks = [];
      //console.log(drinkNames);
      async.eachLimit(drinkNames, 5, async (name) => {
          console.log(name);
          try {
            let  drinksObject = await getDrinksFromServer(name);
            allDrinks.push(drinksObject);
          } catch (e) {
              console.log(e);
              throw new Error(e);
          }
      }, (err) => {
          if (err) {
            console.log(err);
              return res.json({ error: err.message });
          } else {
              let filteredDrinks = allDrinks.filter(drink => drink && (drink.strIngredient1 === ingredient ||
                drink.strIngredient2 === ingredient ||
                drink.strIngredient3 === ingredient ||
                drink.strIngredient4 === ingredient ||
                drink.strIngredient5 === ingredient ||
                drink.strIngredient6 === ingredient));
                return res.json({ success: 'Found', data: filteredDrinks} );
          }
      });
    });
  });

app.listen(3000, () => {
    console.log('Server Started...!!!');
})

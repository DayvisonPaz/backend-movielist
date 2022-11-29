const { default: axios } = require('axios')
const express = require('express')
const path = require('path')
const PORT = process.env.PORT || 3000

express()
  .use(express.json())
  .use(express.static(path.join(__dirname, 'public')))
  .set('views', path.join(__dirname, 'views'))
  .set('view engine', 'ejs')
  .get('/', async(req, res) =>{
    const respo = [] 
    await axios.get(`https://api.themoviedb.org/3/movie/popular?api_key=39113d47500d6a832e88e500d36006ec&language=en-US`).then(response=>respo.push(response.data.results[0])).catch(err=>console.log("nome errado")) 
    setTimeout(resposta,4000)
    function resposta(){
      res.status(200).json(respo)
    }    
  
  })
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))

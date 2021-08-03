import axios from "axios"
import express, { json, response } from "express"
import dotenv from "dotenv"
import twilio from "twilio"
import { stripIndent } from "common-tags"
import { escape } from "querystring"

const router = express.Router()
const MessagingResponse = twilio.twiml.MessagingResponse;
dotenv.config()


const SID = process.env.SID
const AUTH_TOKEN = process.env.AUTH_TOKEN
const YOUTUBE_DATA_API_KEY = process.env.YOUTUBE_DATA_API_KEY
const MAP_API_KEY = process.env.MAP_API_KEY


const client = twilio(SID, AUTH_TOKEN)


router.post('/', async (req, res, next) => {

    const twiml = new MessagingResponse();
    // const query = escape(req.body.Body)
    const query = req.body.Body


    if (query.toLowerCase() === "start" || query.toLowerCase() === "hi" || query.toLowerCase() === "help") {
        twiml.message(stripIndent`
            Hii! Amigo 👋
            I am your Personal Bot 🤖 built with ❤️ by *Pranavdhar*. Here is what I can do for you:

                            *😷Covid Related Info😷*

            👉 1. I can send you the vaccination 💉 centers in your area by Pincode.
            *get centers <pincode>*

            ---------------------------------------------------------------
            ---------------------------------------------------------------

                                  *🍿Other Works🍿*

            👉 2. I can find the address 🌎 of the required areas (malls, petrol stations, theaters,..) within 2km range
            *get locations <search-term>*
            ---------------------------------------------------------------
            👉 3. I can grab the youtube video 🎥 Link based on your message 💌.
            *get video <search-term>*
            ---------------------------------------------------------------
            👉 4. I can get you top 10 repos 📁 by repo name
            *get repo <repo-name>*
            ---------------------------------------------------------------
            👉 5. I can get you top 5 trending news 📰 in your area
            *get news <area-name>*
            ---------------------------------------------------------------
            👉 6. I can send you the image 👨 by their name
            *get image <name>*
            ---------------------------------------------------------------
            👉 7. I can get you a geeky joke 😜
            *get joke*


            ---------------------------------------------------------------
            ---------------------------------------------------------------

                                            *Note*

            Curious to see the code? Here is the Link for the code https://github.com/iampranavdhar
            If you like my work consider giving it a Star🌟

            Try that out now 👇
        `)
    }

    //If it is get video

    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get video") {

        const search_term = query.toLowerCase().split(' ').slice(2).join(' ')

        // Grabbing Data From the Youtube API
        const api_url = `https://www.googleapis.com/youtube/v3/search?key=${YOUTUBE_DATA_API_KEY}&type=video&part=snippet&maxResults=10&q=${escape(search_term)}`
        const response = await axios.get(api_url)
        const videoId = await response.data.items[0].id.videoId
        const videoTitle = await response.data.items[0].snippet.title

        const markdown_format = stripIndent`
        *🍎${videoTitle}*
        👉${`https://www.youtube.com/watch?v=${videoId}`}
        `

        twiml.message(markdown_format)
    }

    else if (req.body.Latitude && req.body.Longitude) {

        //Loading Prev Message for the search term
        const messages = await client.messages.list({
            from: req.body.From,
            to: req.body.To,
            limit: 2
        })
        const prev_message_sid = messages[1].sid
        const message = await client.messages(prev_message_sid).fetch()
        const prev_message = message.body

        //Splitting the search term from the prev message
        const search_term = escape(prev_message.split(' ').slice(2).join(' '))

        //Getting the result locations
        if (search_term !== "") {
            const api_url = `https://api.tomtom.com/search/2/search/${search_term}.json?key=${MAP_API_KEY}&lat=${req.body.Latitude}&lon=${req.body.Longitude}&radius=2000`
            const response = await axios.get(api_url)
            console.log(response.data)
            console.log(api_url)
            const results = await response.data.results
            if (results.length != 0) {
                const message = await results.slice(0, 5).map((place) => stripIndent`
                    ${place.poi.name}
                    ${place.address.freeformAddress}
                    ${place.poi.phone ? place.poi.phone : ""}
                `).join('\n---\n')

                twiml.message(message)
            }
            else if (results.length == 0) {
                twiml.message("Doesn't exists with in 2km ")
            }
        }
        else {
            twiml.message("Please type a command")
        }

    }
    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get locations") {
        twiml.message("Can you share Your location")
    }

    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get repo") {

        const search_term = query.toLowerCase().split(' ').slice(2).join(' ')

        //getting repos
        const api_url = `https://api.github.com/search/repositories?q=${escape(search_term)}&sort=stars&order=desc`
        const response = await axios.get(api_url)
        const repos = await response.data.items.slice(0, 10)
        if (repos.length != 0) {
            const message = await repos.map((repo, index) => stripIndent`
                ${index + 1}.
                *Owner*:${repo.owner.login}
                *RepoName*:${repo.name}
                *RepoURL*:${repo.html_url}
            `).join('\n-----------------------------------\n')

            twiml.message(message)
        }
        else if (results.length == 0) {
            twiml.message("Doesn't exists with in 2km ")
        }

    }
    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get news") {

        const search_term = query.toLowerCase().split(' ').slice(2).join(' ')

        var options = {
            method: 'GET',
            url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/search/NewsSearchAPI',
            params: {
                q: search_term,
                pageNumber: '1',
                pageSize: '5',
                autoCorrect: 'true',
            },
            headers: {
                'x-rapidapi-key': process.env.RAPID_API_KEY,
                'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
            }
        };
        try {
            const response = await axios.request(options)
            const news_articles = await response.data.value
            if (news_articles.length != 0) {
                const message = await news_articles.map((news_article, index) => stripIndent`
                    ${index + 1}.
                    *Title*:${news_article.title}
                    *Link*:${news_article.url}
                `).join('\n------------------------------------------------------------\n')

                twiml.message(message)
            }
            else if (results.length == 0) {
                twiml.message("Can you be more specific")
            }
        }
        catch (err) {
            console.error(error);
        }
    }
    
    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get image") {

        const search_term = query.toLowerCase().split(' ').slice(2).join(' ')

        var options = {
            method: 'GET',
            url: 'https://contextualwebsearch-websearch-v1.p.rapidapi.com/api/Search/ImageSearchAPI',
            params: {
                q: search_term,
                pageNumber: '1',
                pageSize: '1',
                autoCorrect: 'true'
            },
            headers: {
                'x-rapidapi-key': process.env.RAPID_API_KEY,
                'x-rapidapi-host': 'contextualwebsearch-websearch-v1.p.rapidapi.com'
            }
        };

        try {
            const response = await axios.request(options)
            const images = await response.data.value
            const image_url = await images[0].url
            if (images.length != 0) {
                client.messages.create({
                    from: req.body.To,
                    to: req.body.From,
                    body: `${search_term}☝️`,
                    mediaUrl: image_url
                })
            }

            //For Sending the music file from the local folder `http://1c7bc5230d3e.ngrok.io/music/ring.mp3`

            else if (images.length == 0) {
                twiml.message("Can you be more specific")
            }
        }
        catch (err) {
            console.error(error);
        }
    }

    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get joke") {
        //getting repos
        const api_url = `https://geek-jokes.sameerkumar.website/api?format=json`
        const response = await axios.get(api_url)
        const joke = await response.data.joke
        twiml.message(joke)
    }

    else if (query.toLowerCase().split(' ').slice(0, 2).join(' ') === "get centers") {

        const search_term = query.toLowerCase().split(' ').slice(2).join(' ')
        const date = new Date()

        //getting repos
        const api_url = `https://cdn-api.co-vin.in/api/v2/appointment/sessions/public/findByPin?pincode=${search_term}&date=${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`
        const response = await axios.get(api_url)
        console.log(response.data)
        console.log(api_url)
        const centers = await response.data.sessions
        if (centers.length != 0) {
            const message = await centers.map((center, index) => stripIndent`
                ${index + 1}.
                *Center Name*:${center.name}
                *Address*:${center.address} ${center.state_name} ${center.district_name},${center.pincode}
                *Capacity*:${center.available_capacity}[Dose-1=>${center.available_capacity_dose1} Dose-2=>${center.available_capacity_dose2}]
                *Age Limit*:${center.min_age_limit}
                *Fee Type*:${center.fee_type}[Rs.${center.fee}]
                *Slots*:${center.slots}
                *Vaccine-Name*:${center.vaccine}
            `).join('\n----------------------------------------------------------------\n')

            twiml.message(message)
        }
        else if (centers.length == 0) {
            twiml.message("Sorry, There are No Vaccination Sessions in your area right now. ")
        }
    }

    else if (req.body.NumMedia !== 0 && req.body.MediaContentType0 === 'audio/ogg') {
        twiml.message("Thanks for sending us the voice message")
        // console.log(req.body)
    }
    else if (req.body.NumMedia !== 0 && req.body.MediaContentType0 === 'audio/mpeg') {
        twiml.message("Thanks for sending us the audio file")
        // console.log(req.body)
    }

    else {
        twiml.message("Send me a Start/Hi/Help Message for getting to know what Services I am offering ")
    }

    res.writeHead(200, { 'Content-Type': 'text/xml' });
    res.end(twiml.toString());

})

export default router
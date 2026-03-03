require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: process.env.SANITY_PROJECT_ID || '72m8vhy2',
    dataset: process.env.SANITY_DATASET || 'production',
    apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN,
    useCdn: false
})

async function main() {
    const query = `*[_type == "post" && slug.current in [
        "nursing-assistant-night-shift-journey", 
        "nursing-assistant-stressful-relationships-solutions",
        "nursing-assistant-daily-schedule",
        "nursing-assistant-no-experience-insights",
        "nursing-assistant-nursing-school-prep",
        "nursing-assistant-night-shift-practical"
    ]] { title, slug, body }`

    const docs = await client.fetch(query)

    docs.forEach(d => {
        if (!d.body) return

        let fullText = ""
        d.body.forEach(b => {
            if (b.children) {
                fullText += b.children.map(c => c.text).join('') + " "
            }
        })

        // Find sentences with elements of the old MHLW or just the word MHLW
        const regex = /.{0,60}厚生労働省.{0,60}/g
        const matches = fullText.match(regex)

        if (matches) {
            console.log(`\n--- ${d.slug.current} ---`)
            matches.forEach(m => console.log(m.trim()))
        }
    })
}

main().catch(console.error)

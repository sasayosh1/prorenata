require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.local') })
const { createClient } = require('@sanity/client')

const client = createClient({
    projectId: '72m8vhy2', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN
})

async function main() {
    const post = await client.fetch('*[_type == "post" && slug.current == "nursing-assistant-night-shift-journey"][0]')
    if (!post) return;

    let newBody = JSON.parse(JSON.stringify(post.body))
    let modified = false

    for (let i = 0; i < newBody.length; i++) {
        if (newBody[i].markDefs) {
            newBody[i].markDefs.forEach(def => {
                // If it's a link to any mhlw pdf or the top page, rewrite it to the highly actionable JNA guideline
                if (def._type === 'link' && def.href && def.href.includes('mhlw.go.jp')) {
                    console.log("Found: " + def.href)
                    def.href = 'https://www.nurse.or.jp/nursing/shuroanzen/yakin/guideline/index.html'
                    modified = true
                }
            })
        }
    }

    if (modified) {
        await client.patch(post._id).set({ body: newBody }).commit()
        console.log("Patched nursing-assistant-night-shift-journey")
    }
}
main().catch(console.log)

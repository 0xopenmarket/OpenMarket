import 'dotenv/config'
import './testSupport'
import {execute} from "./testSupport";

async function test() {
    const getResult = await execute({
        method: 'GET',
        path: '/ipfs/CID',
        queries: {
            chatQuery: ["Who are you?"],
            // Choose from any model listed here https://docs.red-pill.ai/get-started/supported-models
            model: ["gpt-4o"]
        },
        secret: { apiKey: 'sk-qVBlJkO3e99t81623PsB0zHookSQJxU360gDMooLenN01gv2' },
        headers: {},
    })
    console.log('GET RESULT:', JSON.parse(getResult))

    console.log(`Now you are ready to publish your agent, add secrets, and interact with your agent in the following steps:\n- Execute: 'npm run publish-agent'\n- Set secrets: 'npm run set-secrets'\n- Go to the url produced by setting the secrets (e.g. https://wapo-testnet.phala.network/ipfs/QmPQJD5zv3cYDRM25uGAVjLvXGNyQf9Vonz7rqkQB52Jae?key=b092532592cbd0cf)`)
}

test().then(() => { }).catch(err => console.error(err)).finally(() => process.exit())

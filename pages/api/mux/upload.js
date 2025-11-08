import Mux from '@mux/mux-node'

// This route is a placeholder showing how to create an upload URL with Mux.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).end('Method Not Allowed')
  }

  try {
    const { Mux } = await import('@mux/mux-node')
    const { Video } = new Mux({
      accessToken: process.env.MUX_TOKEN_ID || '',
      secret: process.env.MUX_TOKEN_SECRET || '',
    })

    const upload = await Video.uploads.create({
      new_asset_settings: { playback_policy: 'public' },
    })

    return res.status(200).json(upload)
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Mux error' })
  }
}

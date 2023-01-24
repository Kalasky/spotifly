import { useEffect, useState } from 'react'

const SpotifyLogin = () => {
  const [tokenData, setTokenData] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      const response = await fetch('/api/spotify/callback')
      const data = await response.json()
      setTokenData(data)
    }
    fetchData()
  }, [])

  if (!tokenData) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <h1>Spotify</h1>
      <p>Access Token: {tokenData.access_token}</p>
      <p>Token Type: {tokenData.token_type}</p>
      <p>Expires in: {tokenData.expires_in} seconds</p>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    console.log('Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.from('app_perfil').select('id').limit(1)
    
    if (error) {
      console.error('Connection error:', error)
      return false
    }
    
    console.log('✅ Connection successful!')
    
    // Test if historia tables exist
    const { data: marcosData, error: marcosError } = await supabase.from('app_marco').select('id').limit(1)
    
    if (marcosError) {
      console.log('❌ Historia tables do not exist yet')
      console.log('Error:', marcosError.message)
      return false
    }
    
    console.log('✅ Historia tables already exist!')
    console.log('Found marcos:', marcosData)
    
    return true
  } catch (err) {
    console.error('Unexpected error:', err)
    return false
  }
}

testConnection().then(success => {
  if (success) {
    console.log('🎉 All tests passed!')
  } else {
    console.log('❌ Some tests failed')
  }
})
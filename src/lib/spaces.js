import {supabase,isSupabaseConfigured} from './supabase'
import {demoSpaces} from '../data/demoSpaces'
export async function getSpaces(){
 if(!isSupabaseConfigured)return demoSpaces
 const {data,error}=await supabase.from('study_spaces').select('*').eq('is_active',true).order('name')
 if(error)throw error
 return data??[]
}
export async function updateAvailability(id,availableSeats){
 if(!isSupabaseConfigured){
  const i=demoSpaces.findIndex(s=>s.id===id);if(i<0)throw new Error('Demo space not found.')
  demoSpaces[i]={...demoSpaces[i],available_seats:availableSeats,updated_at:new Date().toISOString()};return demoSpaces[i]
 }
 const {data,error}=await supabase.from('study_spaces').update({available_seats:availableSeats,updated_at:new Date().toISOString()}).eq('id',id).select().single()
 if(error)throw error
 return data
}
export function subscribeToSpaceChanges(onChange){
 if(!isSupabaseConfigured)return ()=>{}
 const channel=supabase.channel('study-spaces-live').on('postgres_changes',{event:'*',schema:'public',table:'study_spaces'},onChange).subscribe()
 return ()=>supabase.removeChannel(channel)
}
export async function getCurrentProfile(userId){
 if(!isSupabaseConfigured)return {id:userId,full_name:'Demo Student',role:'student'}
 const {data,error}=await supabase.from('profiles').select('*').eq('id',userId).single()
 if(error)throw error
 return data
}
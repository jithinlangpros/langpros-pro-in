'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()

    const data = {
        email: formData.get('email') as string,
        password: formData.get('password') as string,
    }

    // Validation
    const errors: { email?: string; password?: string } = {}

    if (!data.email || !data.email.includes('@')) {
        errors.email = 'Please enter a valid email address'
    }

    if (!data.password || data.password.length < 6) {
        errors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(errors).length > 0) {
        // Return errors as a string for display
        return { error: JSON.stringify(errors) }
    }

    const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Get user role to redirect to correct dashboard
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('user_role')
            .eq('user_email', user.email)
            .single()

        const role = roleData?.user_role

        if (role === 'pm') {
            redirect('/project-manager')
        } else if (role === 'inv') {
            redirect('/inventory-manager')
        } else if (role === 'tech') {
            redirect('/tech')
        } else {
            redirect('/unauthorized')
        }
    }

    redirect('/')
}

export async function signOut() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/')
}

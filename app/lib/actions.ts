'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { FormDataZod } from './definitions';


export type State = {
    errors?: {
        customerId?: string[];
        amount?: string[];
        status?: string[];
    };
    message?: string | null;
};

//for authentication

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', formData);
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}


const FormSchema = z.object({
    id: z.string(),
    customerId: z.string({
        invalid_type_error: 'Please select a customer.'
    }),
    amount: z.coerce.number().gt(0, { message: "Please enter an amount greater than $0" }),
    status: z.enum(['paid', 'pending'], { invalid_type_error: "Please select an invoice status" }),
    date: z.string(),
});



const CreateInvoice = FormSchema.omit({ id: true, date: true });


export async function createInvoice(newInvoice: FormDataZod) {

    const validationFields = CreateInvoice.safeParse(newInvoice);

    if (!validationFields.success) {
        let errorMessage = "";
        validationFields.error.issues.forEach((issue) => {
            errorMessage += `${issue.path[0]}: ${issue.message}`;
        })
        return {
            error: errorMessage
        }
    }


    const { customerId, amount, status } = validationFields.data;

    const amountInCents = amount * 100;
    const date = new Date().toISOString().split('T')[0];

    try {
        await sql`
        INSERT INTO invoices (customer_id, amount, status, date)
        VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
        `;
    } catch (error) {
        return {
            message: "Database Error: Failed to create invoice."
        }
    }
    revalidatePath('/dashboard/invoices');
    // revalidatePath('/dashboard/dashboard');
    redirect('/dashboard/invoices');

}

const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export async function updateInvoice(id: string, updatedInvoice: FormDataZod) {

    const validationFields = UpdateInvoice.safeParse(updatedInvoice);

    if (!validationFields.success) {
        let errorMessage = "";
        validationFields.error.issues.forEach((issue) => {
            errorMessage += `${issue.path[0]}: ${issue.message}`;
        })
        return {
            error: errorMessage
        }
    }

    const { customerId, amount, status } = validationFields.data;

    const amountInCents = amount * 100;

    try {
        await sql`
     UPDATE invoices
     SET customer_id=${customerId}, amount=${amountInCents}, status=${status}
     where id=${id}
     `

    } catch (error) {
        return {
            message: "Database Error: Failed to update invoice."
        }
    }
    revalidatePath('/dashboard/invoices');
    // revalidatePath('/dashboard/dashboard');
    redirect('/dashboard/invoices');
}


export async function deleteInvoice(id: string) {

    try {
        await sql`
        DELETE FROM invoices
        WHERE id=${id}
        `;

        revalidatePath('/dashboard/invoices');
        // revalidatePath('/dashboard/dashboard');
        return {
            message: "Invoice deleted successfully."
        }
    } catch (error) {
        return {
            message: "Database Error: Failed to delete invoice."
        }
    }
}
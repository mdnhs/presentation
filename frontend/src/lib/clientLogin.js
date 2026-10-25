// Client portal logins: a user linked to one client (users.client). The server keeps it a viewer
// and shows it only that client's projects (backend/pb_migrations/1761700000_client_portal.js).
import { pb } from './pb.js'

/** The login for a client, or null. */
export async function findLogin(clientId) {
  const list = await pb.collection('users').getList(1, 1, { filter: pb.filter('client = {:id}', { id: clientId }) })
  return list.items[0] ?? null
}

/** Creates the client's login: a viewer that sees only this client. */
export function createLogin(client, { email, password }) {
  return pb.collection('users').create({
    name: client.contact_name || client.name,
    email: email.trim(),
    password,
    passwordConfirm: password,
    role: 'viewer',
    client: client.id,
    verified: true,
  })
}

export const setLoginPassword = (user, password) => pb.collection('users').update(user.id, { password, passwordConfirm: password })
export const setLoginDisabled = (user, disabled) => pb.collection('users').update(user.id, { suspended: disabled })
export const removeLogin = (user) => pb.collection('users').delete(user.id)

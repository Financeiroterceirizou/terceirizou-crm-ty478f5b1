// CRM Terceirizou — correção: define o papel (role) do usuário admin criado no seed 0007.
migrate(
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@terceirizou.com.br')
      admin.set('role', 'admin')
      app.save(admin)
    } catch (_) {}
  },
  (app) => {
    try {
      const admin = app.findAuthRecordByEmail('_pb_users_auth_', 'admin@terceirizou.com.br')
      admin.set('role', '')
      app.save(admin)
    } catch (_) {}
  },
)

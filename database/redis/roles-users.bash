# admin user:
ACL SETUSER admin on >AdminPass123 allcommands allkeys

# readonly user:
ACL SETUSER readonly on >ReadOnlyPass123 +get +mget ~* 

# write user:
ACL SETUSER writer on >WriterPass123 +get +mget +set +del +exists ~*
{
  "targets": [
    {
      "target_name": "sqlchop",
      "sources": [ "lib/sqlchop.cc" ],
      'include_dirs': [ 'lib/sqlchop' ],
      'ldflags': ['-L../lib/sqlchop -Wl,-rpath .'],
      'libraries': [ '-lsqlchop' ]
    }
  ]
}

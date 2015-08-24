{
  "targets": [
    {
      "target_name": "sqlchop",
      "sources": [ "lib/sqlchop.cc" ],
      "include_dirs": [ "<(module_root_dir)/lib/sqlchop" ],
      "libraries": ["-lsqlchop" ],
      "ldflags": ["-Wl,-rpath,<(module_root_dir)/lib/sqlchop", "-L<(module_root_dir)/lib/sqlchop"],
      'xcode_settings': {
        'OTHER_LDFLAGS': [
          '-Wl,-rpath,<(module_root_dir)/lib/sqlchop',
          '-L<(module_root_dir)/lib/sqlchop'
        ]
      }
    }
  ]
}

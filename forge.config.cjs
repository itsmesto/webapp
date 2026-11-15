module.exports = {
  packagerConfig: {
    asar: false,
    prune: true,
    ignore: [
      /^\/data(?:\/|$)/,
      /^\/tmp(?:\/|$)/,
      /^\/\.git(?:\/|$)/,
      /\.sqlite(?:-shm|-wal)?$/,
    ],
  },
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'LedgerlyBusinessOperations',
        authors: 'Ledgerly',
        description: 'Business operations, invoices, inventory, expenses and reports.',
      },
    },
  ],
};


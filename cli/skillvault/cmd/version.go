package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

const cliVersion = "0.1.0"

var versionCmd = &cobra.Command{
	Use:   "version",
	Short: "Print the CLI version",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Printf("skillvault version %s\n", cliVersion)
	},
}

func init() {
	rootCmd.AddCommand(versionCmd)
}

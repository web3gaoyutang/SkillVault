package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var loginCmd = &cobra.Command{
	Use:   "login [server-url]",
	Short: "Authenticate with a SkillVault server",
	Args:  cobra.MaximumNArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		url := serverURL
		if len(args) > 0 {
			url = args[0]
		}
		if url == "" {
			return fmt.Errorf("server URL is required (use --server or pass as argument)")
		}
		// TODO: prompt for credentials, authenticate, store token
		fmt.Printf("Logging in to %s...\n", url)
		fmt.Println("Login not yet implemented")
		return nil
	},
}

func init() {
	rootCmd.AddCommand(loginCmd)
}

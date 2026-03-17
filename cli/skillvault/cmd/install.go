package cmd

import (
	"fmt"

	"github.com/spf13/cobra"
)

var (
	installTarget string
	installScope  string
)

var installCmd = &cobra.Command{
	Use:   "install [org/name]",
	Short: "Install a skill from the registry",
	Args:  cobra.ExactArgs(1),
	RunE: func(cmd *cobra.Command, args []string) error {
		skillRef := args[0]
		// TODO: resolve version, download artifact, verify checksum, install via adapter
		fmt.Printf("Installing %s (target=%s, scope=%s)...\n", skillRef, installTarget, installScope)
		fmt.Println("Install not yet implemented")
		return nil
	},
}

func init() {
	installCmd.Flags().StringVar(&installTarget, "target", "openclaw", "Target runtime (openclaw, claude)")
	installCmd.Flags().StringVar(&installScope, "scope", "project", "Install scope (user, project)")
	rootCmd.AddCommand(installCmd)
}

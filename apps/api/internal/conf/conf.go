package conf

import "time"

type Bootstrap struct {
	Server *Server `yaml:"server"`
	Data   *Data   `yaml:"data"`
	Auth   *Auth   `yaml:"auth"`
	Scan   *Scan   `yaml:"scan"`
}

type Server struct {
	HTTP *ServerConfig `yaml:"http"`
	GRPC *ServerConfig `yaml:"grpc"`
}

type ServerConfig struct {
	Addr    string        `yaml:"addr"`
	Timeout time.Duration `yaml:"timeout"`
}

type Data struct {
	Database *Database `yaml:"database"`
	Redis    *Redis    `yaml:"redis"`
	MinIO    *MinIO    `yaml:"minio"`
}

type Database struct {
	Driver          string        `yaml:"driver"`
	Source          string        `yaml:"source"`
	MaxOpenConns    int           `yaml:"max_open_conns"`
	MaxIdleConns    int           `yaml:"max_idle_conns"`
	ConnMaxLifetime time.Duration `yaml:"conn_max_lifetime"`
}

type Redis struct {
	Addr         string        `yaml:"addr"`
	Password     string        `yaml:"password"`
	DB           int           `yaml:"db"`
	ReadTimeout  time.Duration `yaml:"read_timeout"`
	WriteTimeout time.Duration `yaml:"write_timeout"`
}

type MinIO struct {
	Endpoint  string `yaml:"endpoint"`
	AccessKey string `yaml:"access_key"`
	SecretKey string `yaml:"secret_key"`
	Bucket    string `yaml:"bucket"`
	UseSSL    bool   `yaml:"use_ssl"`
}

type Auth struct {
	JWTSecret       string        `yaml:"jwt_secret"`
	AccessTokenTTL  time.Duration `yaml:"access_token_ttl"`
	RefreshTokenTTL time.Duration `yaml:"refresh_token_ttl"`
}

type Scan struct {
	MaxPackageSize int64  `yaml:"max_package_size"`
	MaxFileCount   int    `yaml:"max_file_count"`
	SandboxDir     string `yaml:"sandbox_dir"`
}

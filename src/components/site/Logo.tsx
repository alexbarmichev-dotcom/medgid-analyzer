const Logo = ({ className = '' }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <span className="relative grid h-9 w-9 place-items-center rounded-[11px] bg-accent px-[5px] py-0 my-0 mx-0">
        <img
          src="/logo-small.webp"
          width={36}
          height={36}
          alt="ЛабГид"
          className="h-full w-full mx-0 px-0 rounded-0 object-cover"
        />
      </span>
      <b className="font-head text-[1.3rem] font-extrabold tracking-[-0.03em] text-foreground">
        ЛабГид
      </b>
    </div>
  );
};

export default Logo;